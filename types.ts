export interface Chunk {
  index: string;
  start: string;
  end: string;
  text: string;
}

export type Segment = {
  id: number;
  timestamp: string;
  text: string;
}