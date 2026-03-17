import { groupSegmentsByTokenLength } from "@/lib/srt";
import { parseSegment } from "@/lib/client";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

const MAX_TOKENS_IN_SEGMENT = 700;

const retrieveTranslation = async (text: string, language: string, expectedCount: number) => {
	let retries = 3;
	while (retries > 0) {
		try {
			const { text: translatedText } = await generateText({
				model: google("gemini-2.0-flash-exp"),
				messages: [
					{
						role: "system",
						content:
							"You are an experienced semantic translator for SRT subtitle files. CRITICAL RULES:\n" +
							"1. Separate each translated segment with the '|' symbol.\n" +
							"2. You MUST output EXACTLY the same number of segments as the input. Do NOT merge or split segments.\n" +
							"3. Each input segment separated by '|' must produce exactly one output segment separated by '|'.\n" +
							"4. Preserve the one-to-one mapping between input and output segments.",
					},
					{
						role: "user",
						content: `Translate these ${expectedCount} subtitle segments to ${language}. Output exactly ${expectedCount} segments separated by '|':\n${text}`,
					},
				],
			});

			return translatedText;
		} catch (error) {
			console.error("Translation error:", error);
			if (retries > 1) {
				console.warn("Retrying translation...");
				await new Promise((resolve) => setTimeout(resolve, 1000));
				retries--;
				continue;
			}
			throw error;
		}
	}
};

export async function POST(request: Request) {
	try {
		const { content, language } = await request.json();
		const segments = content.split(/\r\n\r\n|\n\n/).map(parseSegment);
		const groups = groupSegmentsByTokenLength(segments, MAX_TOKENS_IN_SEGMENT);

		let currentIndex = 0;
		const encoder = new TextEncoder();

		const stream = new ReadableStream({
			async start(controller) {
				for (const group of groups) {
					const text = group.map((segment) => segment.text).join("|");
					const translatedText = await retrieveTranslation(text, language, group.length);
					if (!translatedText) continue;

					const translatedSegments = translatedText.split("|").map(s => s.trim()).filter(Boolean);

					// Ensure 1:1 mapping: pad or truncate to match original group size
					for (let i = 0; i < group.length; i++) {
						const originalSegment = segments[currentIndex];
						const translated = translatedSegments[i] || originalSegment?.text || "";
						const srt = `${++currentIndex}\n${originalSegment?.timestamp || ""}\n${translated}\n\n`;
						controller.enqueue(encoder.encode(srt));
					}
				}
				controller.close();
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
