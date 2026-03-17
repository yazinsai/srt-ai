import React, { FC } from "react";
import "tailwindcss/tailwind.css";
import type { Chunk } from "@/types";

const Timestamp: FC<Chunk> = ({ index, start, end, text }) => {
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '00:00.0';
    const parts = timestamp.split(":");
    if (parts.length < 3) return timestamp;
    const [hours, minutes, secondsWithMs] = parts;
    const [seconds, ms] = (secondsWithMs || "0,0").split(",");
    return `${minutes}:${seconds}.${(ms || "0")[0]}`;
  };

  return (
    <div className="flex">
      <div className="flex flex-col items-center">
        <div className="flex items-center mb-1">
          <span className="text-xl">⏲</span>
          <p className="ml-2 text-gray-400">{formatTimestamp(start)}</p>
        </div>
        <div className="flex items-center">
          <span className="text-xl">⏲</span>
          <p className="ml-2 text-gray-400">{formatTimestamp(end)}</p>
        </div>
      </div>
      <textarea
        className="flex-grow h-full ml-4 bg-gray-200 p-2 rounded-lg"
        value={text}
        readOnly
      />
    </div>
  );
};

export default Timestamp;
