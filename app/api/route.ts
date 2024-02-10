import { groupSegmentsByTokenLength, parseStreamedResponse } from "@/lib/srt";
import { parseSegment } from "@/lib/client";
import { kv } from '@vercel/kv';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const dynamic = 'force-dynamic' // defaults to auto

// The total number of tokens supported by OpenAI APIs is 4096 across all models.
// That means Output + Input + Prompt = 4096 tokens. Since our prompt is 50 tokens,
// and the output is 4.5 * input, we can calculate the maximum input length as:
// 4096 = 50 + 4.5 * Input + Input
// i.e. Input = 700 tokens maximum
// We use 4.5 * Input to consider the worst-case scenario where we're translating from
// English to Indian, which is the longest language in terms of token length.
const MAX_TOKENS_IN_SEGMENT = 700;

const retrieveTranslation = async (
  text: string,
  language: string
) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo-0125",
      max_tokens: 2048,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 1,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced semantic translator. Follow the instructions carefully.",
        },
        {
          role: "user",
          content: `Translate this to ${language}. Interleave the "|" segment separator in the response. ALWAYS return the SAME number of segments. NEVER skip any segment. NEVER combine segments.\n\n${text}`,
        },
      ],
      stream: true,
    }),
  });

  if (response.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  return response;
};

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: "'id' required" }), { status: 400 });

    const { sessionId, content, language } = await kv.get<any>(id)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

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
            const srt = [++index, timestamp, decoded].join("\n")
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
