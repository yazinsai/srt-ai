import { Segment } from "@/types";

export function parseSegment(text: string): Segment {
  const [id, timestamp, ...lines] = text.split(/\r\n|\n/);
  return {
    id: parseInt(id),
    timestamp,
    text: lines.join("\n"),
  };
}