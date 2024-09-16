import { groupSegmentsByTokenLength, parseStreamedResponse } from "@/lib/srt";
import { parseSegment } from "@/lib/client";

export const dynamic = 'force-dynamic' // defaults to auto

// The total number of tokens supported by OpenAI APIs is 4096 across all models.
// That means Output + Input + Prompt = 4096 tokens. Since our prompt is 50 tokens,
// and the output is 4.5 * input, we can calculate the maximum input length as:
// 4096 = 50 + 4.5 * Input + Input
// i.e. Input = 700 tokens maximum
// We use 4.5 * Input to consider the worst-case scenario where we're translating from
// English to Indian, which is the longest language in terms of token length.
const MAX_TOKENS_IN_SEGMENT = 700;

const retrieveTranslation = async (text: string, language: string) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: "You are an experienced semantic translator, specialized in creating SRT files. Separate translation segments with the '|' symbol",
            },
            {
              "role": "user",
              "content": `Translate this to ${language}: ${text}`
            }
          ],
          stream: true,
        }),
      });

      if (response.status === 429) {
        // Log the rate limit error and retry after a delay
        console.warn("Rate limit exceeded, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Retry after 1 second
        retries--;
        continue; // Retry the request
      }

      if (response.status !== 200) {
        const errorMessage = await response.json();
        throw new Error(`OpenAI API returned an error: ${errorMessage.message}`);
      }

      return response;
    } catch (error) {
      if (retries <= 0) {
        console.error("Error in retrieveTranslation after retries:", error);
        throw new Error("Translation request failed after multiple retries.");
      }
    }
  }
};

export async function POST(request: Request) {
  try {
    const { content, language } = await request.json()
    const segments = content.split(/\r\n\r\n|\n\n/).map(parseSegment);
    const groups = groupSegmentsByTokenLength(segments, MAX_TOKENS_IN_SEGMENT);

    let index = 0;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (const group of groups) {
          const text = group.map((segment) => segment.text).join("|");
          const response = await retrieveTranslation(text, language);
          const srtStream = parseStreamedResponse(response);
          const reader = srtStream.getReader();
    
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
    
            const timestamp = segments[index].timestamp;
            const decoded = decoder.decode(value);
    
            // Debugging output
            console.log("Decoded value:", decoded);
    
            const srt = [++index, timestamp, decoded].join("\n");
            controller.enqueue(encoder.encode(srt));
          }
        }
    
        controller.close();
      }
    });    

    return new Response(stream);
  } catch (error) {
    console.error("Error during translation:", error);
    return new Response(JSON.stringify({ error: "Error during translation" }), {
      status: 500,
    });
  }
}
