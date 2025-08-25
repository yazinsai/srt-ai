import type { Segment } from "@/types";
import { createParser } from "eventsource-parser";
import type { ParsedEvent, ReconnectInterval } from "eventsource-parser";
// Google SDK import removed - now using OpenRouter in route.ts
import { JSONParser } from "@streamparser/json";

/**
 * Groups segments into groups of length `length` or less.
 */
export function groupSegmentsByTokenLength(
	segments: Segment[],
	length: number,
) {
	const groups: Segment[][] = [];
	let currentGroup: Segment[] = [];
	let currentGroupTokenCount = 0;

	function numTokens(text: string) {
		return Math.ceil(text.length / 4);
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

	return groups;
}

// Ensures that we enqueue full segments only, and not partial segments.
export function parseStreamedResponse(
	response: Response,
): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const parser = new JSONParser({ paths: ["$.*"] });

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

				try {
					parser.write(text);
				} catch (e) {
					controller.error(e);
				}
			};

			// @ts-ignore - JSONParser types are incorrect
			parser.onValue = (value: unknown) => {
				controller.enqueue(encoder.encode(value as string));
			};

			parser.onError = (err) => {
				controller.error(err);
			};

			const parserFeed = createParser(onParse);

			if (response.body) {
				const reader = response.body.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					parserFeed.feed(decoder.decode(value));
				}
			}

			parser.end();
			controller.close();
		},
	});
}
