// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from "eventsource-parser";

export const config = {
  runtime: "edge",
};

const stripSRT = (srt: string) => {
  const regex =
    /(\d+)\s*\n(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n([\s\S]*?)(?=\n{2}\d+\s*\n|\n*$)/g;
  const timestamps: string[] = [];
  const texts: string[] = [];

  srt.replace(regex, (_match, _index, start, end, text) => {
    timestamps.push(`${start} --> ${end}`);
    texts.push(text.trim());
    return "";
  });

  return { timestamps, textContent: texts.join("|") };
};

const retrieveTranslation = async (
  text: string,
  language: string,
  timestamps: string[]
) => {
  console.log("Retrieving translation for", text, "in", language);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
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
          content: `Translate this to ${language}. Interleave the "|" segment separator in the response.\n\n${text}`,
        },
      ],
      stream: true,
    }),
  });

  if (response.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  return streamFromResponse(response, timestamps);
};

const streamFromResponse = (
  response: any,
  timestamps: string[]
): ReadableStream => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let index = 0;

  const reconstructPartialSRT = (text: string) => {
    const reconstructedSRT = `${index + 1}\n${timestamps[index]}\n${text}\n\n`;
    index++;
    return reconstructedSRT;
  };

  return new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type !== "event") return;

        const data = event.data;

        if (data === "[DONE]") {
          controller.close();
          return;
        }

        try {
          const json = JSON.parse(data);
          const text = json.choices[0]?.delta?.content;
          if (!text) return;
          buffer += text;

          let lastIndex = buffer.lastIndexOf("|");
          if (lastIndex === -1) return;

          // Return segment
          const segments = buffer.split("|");
          const completeSegment = segments.slice(0, -1).join("|");
          const partialSegment = segments.slice(-1)[0];

          const reconstructedSRT = reconstructPartialSRT(completeSegment);
          controller.enqueue(encoder.encode(reconstructedSRT));

          buffer = partialSegment;
        } catch (e) {
          controller.error(e);
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of response.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });
};

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Invalid request method" }), {
      status: 405,
    });

  try {
    const { content, language } = (await req.json()) as any;
    const { timestamps, textContent } = stripSRT(content);
    const stream = await retrieveTranslation(textContent, language, timestamps);
    return new Response(stream);
  } catch (error) {
    console.error("Error during translation:", error);
    return new Response(JSON.stringify({ error: "Error during translation" }), {
      status: 500,
    });
  }
}
