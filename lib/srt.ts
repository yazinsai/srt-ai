import { Segment } from "@/types";
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from "eventsource-parser";
import { encoding_for_model } from "tiktoken";
import { JSONParser } from '@streamparser/json';
import type { ParsedElementInfo } from '@streamparser/json';

/**
 * Groups segments into groups of length `length` or less.
 */
export function groupSegmentsByTokenLength(segments: Segment[], length: number) {
  const groups: Segment[][] = [];
  let currentGroup: Segment[] = [];
  let currentGroupTokenCount = 0;
  const encoder = encoding_for_model("gpt-3.5-turbo");

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

// Ensures that we enqueue full segments only, and not partial segments.
export function parseStreamedResponse(
  response: any,
): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  // Initialize the JSONParser with options tailored for your needs
  // Here, we're interested in all elements of an array, hence the path '$.*'
  const parser = new JSONParser({ paths: ['$.*'] });

  return new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type !== "event") return;

        const data = event.data;

        if (data === "[DONE]") {
          controller.close();
          return;
        }

        const json = JSON.parse(data);
        const text = json.choices[0]?.delta.content;
        if (!text) return;

        // Direct JSON parsing to JSONParser
        try {
          parser.write(text); // Feed the data directly to JSONParser
        } catch (e) {
          controller.error(e);
        }
      };

      // Define the callback to process each array element
      // This function is called whenever a complete array element is parsed
      parser.onValue = (parsedElementInfo: ParsedElementInfo.ParsedElementInfo) => {
        // Process the value here
        // `value` is the parsed JSON array element
        // Ensure that we're at the root of the JSON structure (stack === 1) to process top-level array elements
        if (parsedElementInfo.stack.length === 1) {
          controller.enqueue(encoder.encode(parsedElementInfo.value as string));
        }
      };

      parser.onError = (err) => {
        controller.error(err);
      };

      const parserFeed = createParser(onParse);

      for await (const chunk of response.body as any) {
        parserFeed.feed(decoder.decode(chunk));
      }

      // Finalize JSON parsing
      parser.end();
      controller.close();
    },
  });
};
