import { Segment } from "@/types";
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from "eventsource-parser";
import { encoding_for_model } from "tiktoken";

/**
 * Groups segments into groups of length `length` or less.
 */
export function groupSegmentsByTokenLength(segments: Segment[], length: number) {
  const groups: Segment[][] = [];
  let currentGroup: Segment[] = [];
  let currentGroupTokenCount = 0;
  const encoder = encoding_for_model("gpt-4o-mini");

  function numTokens(text: string) {
    const tokens = encoder.encode(text);
    return tokens.length;
  }

  for (const segment of segments) {
    const segmentTokenCount = numTokens(segment.text);

    if (currentGroupTokenCount + segmentTokenCount <= length) {
      currentGroup.push(segment);
      currentGroupTokenCount += segmentTokenCount + 1; // include size of the "|" delimeter
    } else {
      groups.push(currentGroup);
      currentGroup = [segment];
      currentGroupTokenCount = segmentTokenCount;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  encoder.free(); // clear encoder from memory
  return groups;
}

export function parseStreamedResponse(response: any): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

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
          // Log the raw data received from OpenAI
          console.log("Raw data received:", data);

          const json = JSON.parse(data);
          console.log("Parsed JSON:", json); // Log parsed JSON

          const text = json.choices[0]?.delta?.content;
          if (!text) return;
          buffer += text;

          // If there's a "|" in the buffer, we can enqueue a segment
          if (buffer.includes("|")) {
            const segments = buffer.split("|");
            segments.slice(0, -1).forEach(segment => {
              controller.enqueue(encoder.encode(segment));
            });
            buffer = segments[segments.length - 1]; // Keep the remaining text
          }
        } catch (e) {
          console.error("Error parsing response:", e); // Log errors during parsing
          controller.error(e);
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of response.body as any) {
        const decodedChunk = decoder.decode(chunk);
        console.log("Raw chunk received:", decodedChunk); // Log each raw chunk received
        parser.feed(decodedChunk); // Feed the chunk into the parser
      }

      // Process any remaining buffer content
      if (buffer.length > 0) {
        console.log("Final buffer content:", buffer); // Log any final buffer content
        controller.enqueue(encoder.encode(buffer));
      }

      controller.close();
    },
  });
}
