import { groupSegmentsByTokenLength, parseStreamedResponse } from "@/lib/srt";
import { parseSegment } from "@/lib/client";
import { kv } from "@vercel/kv";
import { SRTParser, ParsedSubtitle } from "@/lib/srt/parser";
import { SRTValidator } from "@/lib/srt/validator";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const dynamic = "force-dynamic";
export const runtime = "edge";

const MAX_TOKENS_IN_SEGMENT = 200_000;
const BATCH_TIMEOUT = 30000; // 30 seconds per batch

const retrieveTranslation = async (text: string, language: string, timeout: number = BATCH_TIMEOUT) => {
	let retries = 3;
	while (retries > 0) {
		try {
			// Create a timeout promise
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Translation timeout')), timeout);
			});

			// Make direct API call to OpenRouter
			const translationPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
					"HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
					"X-Title": "SRT Translator",
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"model": "google/gemini-2.5-flash",
					"messages": [
						{
							"role": "system",
							"content": `You are a subtitle translator. Translate the given subtitles to ${language}.

The input contains numbered subtitles in format: [1] text | [2] text | [3] text

CRITICAL RULES:
1. Output MUST have the EXACT SAME numbered format: [1] translation | [2] translation | [3] translation
2. NEVER skip any number - maintain the exact sequence [1], [2], [3], etc.
3. NEVER combine segments
4. Keep ALL numbers in sequence
5. If you can't translate a segment, output: [N] [UNTRANSLATABLE]
6. Keep translations concise (max 2 lines)
7. ALWAYS include the [N] number prefix for each translation
8. Use the pipe separator | between translations

Example:
Input: "[1] Hello | [2] How are you? | [3] I'm fine"
Output: "[1] مرحبا | [2] كيف حالك؟ | [3] أنا بخير"`
						},
						{
							"role": "user",
							"content": text
						}
					],
					"temperature": 0.3,  // Lower temperature for more consistent output
					"max_tokens": 8192  // Increased to handle longer responses
				})
			}).then(async (response) => {
				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
				}
				const data = await response.json();
				const content = data.choices[0].message.content;
				
				// Log the raw response for debugging
				console.log(`Raw translation response (first 200 chars): ${content.substring(0, 200)}...`);
				console.log(`Response segment count: ${content.split('|').length}`);
				
				return content;
			});

			const result = await Promise.race([translationPromise, timeoutPromise]) as string;
			return result;
		} catch (error: any) {
			// Log full error details
			console.error(`Translation error (attempt ${4 - retries}/3):`);
			console.error('Error message:', error?.message);
			if (error?.response) {
				console.error('Response status:', error.response.status);
				console.error('Response data:', error.response.data);
			}
			if (error?.cause) {
				console.error('Error cause:', error.cause);
			}
			
			// Extract error details for better debugging
			const errorDetails = {
				message: error?.message || 'Unknown error',
				status: error?.response?.status,
				data: error?.response?.data,
				responseBody: error?.responseBody,
				cause: error?.cause
			};
			console.error('Full error details:', JSON.stringify(errorDetails, null, 2));
			
			if (retries > 1) {
				console.warn("Retrying translation...");
				await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
				retries--;
				continue;
			}
			throw error;
		}
	}
};

export async function POST(request: Request) {
	try {
		const { id } = await request.json();
		if (!id)
			return new Response(JSON.stringify({ error: "'id' required" }), {
				status: 400,
			});

		const kvData = await kv.get<any>(id);
		if (!kvData) {
			return new Response(JSON.stringify({ error: "Session not found" }), {
				status: 404,
			});
		}

		const { sessionId, content, language } = kvData;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		// Check if payment was successful
		if (session.payment_status !== 'paid') {
			return new Response(JSON.stringify({ error: "Payment not completed" }), {
				status: 400,
			});
		}

		// Parse SRT content for better handling
		const parser = new SRTParser();
		const validator = new SRTValidator();
		
		let subtitles: ParsedSubtitle[];
		try {
			subtitles = parser.parse(content);
		} catch (parseError) {
			// Fallback to old parsing method
			console.warn('SRT parsing failed, using fallback:', parseError);
			const segments = content.split(/\r\n\r\n|\n\n/).map(parseSegment);
			subtitles = segments.map((seg: any, i: number) => ({
				id: String(seg.id || i + 1),
				startTime: seg.timestamp?.split(' --> ')[0] || '00:00:00,000',
				endTime: seg.timestamp?.split(' --> ')[1] || '00:00:00,000',
				text: seg.text || '',
			}));
		}

		// Validate input
		const validationResult = validator.validateSubtitles(subtitles);
		if (validationResult.errors.length > 0) {
			console.warn('Input validation errors:', validationResult.errors);
		}

		// Calculate optimal batch size - use smaller batches for better reliability
		const batchSize = Math.min(parser.calculateOptimalBatchSize(subtitles), 5); // Reduced from 10 to 5
		const batches = parser.batchSubtitles(subtitles, batchSize);
		const totalBatches = batches.length;

		const encoder = new TextEncoder();
		let processedCount = 0;
		let completedBatches = 0;

		const stream = new ReadableStream({
			async start(controller) {
				try {
					// Send initial progress
					controller.enqueue(encoder.encode(`[PROGRESS:0]\n`));

					for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
						const batch = batches[batchIndex];
						if (!batch) continue;

						const batchNumber = batchIndex + 1;
						console.log(`Processing batch ${batchNumber}/${totalBatches}`);

						try {
							// Try numbered format for better tracking
							const numberedText = batch.map((segment, idx) => `[${idx+1}] ${segment.text}`).join(" | ");
							console.log(`Batch ${batchNumber}: Sending ${batch.length} segments for translation`);
							console.log(`Input format: ${numberedText.substring(0, 150)}...`);
							
							const translatedText = await retrieveTranslation(numberedText, language, BATCH_TIMEOUT);
							
							if (!translatedText) {
								// Send untranslated as fallback
								console.warn(`Batch ${batchNumber}: No translation received`);
								for (const subtitle of batch) {
									const srt = `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n[TRANSLATION FAILED] ${subtitle.text}\n\n`;
									controller.enqueue(encoder.encode(srt));
									processedCount++;
								}
							} else {
								// Parse numbered format and build index map for reliable matching
								const rawSegments = translatedText.split("|");
								const translationMap = new Map<number, string>();

								for (const s of rawSegments) {
									const trimmed = s.trim();
									if (!trimmed) continue;

									// Extract [N] number and text
									const match = trimmed.match(/^\[(\d+)\]\s*(.*)$/)
										|| trimmed.match(/^(\d+)\.\s*(.*)$/)
										|| trimmed.match(/^(\d+)\)\s*(.*)$/)
										|| trimmed.match(/^(\d+)[\]\)\.\-\:\s]+(.*)$/);

									if (match && match[1] && match[2]) {
										translationMap.set(parseInt(match[1]), match[2].trim());
									} else {
										// Positional fallback: assign to next unassigned index
										const nextIdx = translationMap.size + 1;
										translationMap.set(nextIdx, trimmed);
									}
								}

								console.log(`Batch ${batchNumber}: Received ${translationMap.size} translations for ${batch.length} segments`);

								if (translationMap.size !== batch.length) {
									console.warn(`Batch ${batchNumber}: Translation count mismatch! Expected ${batch.length}, got ${translationMap.size}`);
								}

								for (let i = 0; i < batch.length; i++) {
									const subtitle = batch[i];
									// Look up by 1-based index from the [N] prefix
									let translated = translationMap.get(i + 1);

									if (!translated || translated === '[UNTRANSLATABLE]' || translated === '') {
										translated = subtitle?.text || '';
										console.warn(`Batch ${batchNumber}, Segment ${i+1}: No translation for subtitle ${subtitle?.id}, using original`);
									}

									if (subtitle) {
										const srt = `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${translated}\n\n`;
										controller.enqueue(encoder.encode(srt));
										processedCount++;
									}
								}
							}

							completedBatches++;
							const progress = Math.round((completedBatches / totalBatches) * 100);
							console.log(`Progress: ${progress}% (${completedBatches}/${totalBatches} batches)`);
							controller.enqueue(encoder.encode(`[PROGRESS:${progress}]\n`));

						} catch (batchError) {
							console.error(`Batch ${batchNumber} error:`, batchError);
							
							// Send error subtitles
							for (const subtitle of batch) {
								const srt = `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n[ERROR] ${subtitle.text}\n\n`;
								controller.enqueue(encoder.encode(srt));
								processedCount++;
							}

							completedBatches++;
							const progress = Math.round((completedBatches / totalBatches) * 100);
							controller.enqueue(encoder.encode(`[PROGRESS:${progress}]\n`));
						}

						// Small delay between batches
						await new Promise(resolve => setTimeout(resolve, 100));
					}

					// Send final progress
					controller.enqueue(encoder.encode(`[PROGRESS:100]\n`));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Translation failed';
					console.error('Translation error:', errorMessage);
					controller.enqueue(encoder.encode(`[ERROR:${errorMessage}]`));
				} finally {
					controller.close();
				}
			},
		});

		return new Response(stream);
	} catch (error) {
		console.error("Error during translation:", error);
		return new Response(JSON.stringify({ error: "Error during translation" }), {
			status: 500,
		});
	}
}
