import React, { FC } from "react";
import "tailwindcss/tailwind.css";
import type { Chunk } from "@/types";

const Timestamp: FC<Chunk> = ({ index, start, end, text }) => {
  const formatTimestamp = (timestamp: string) => {
    let [hours, minutes, secondsWithMs] = timestamp.split(":");
    const [seconds, ms] = secondsWithMs.split(",");

    return `${minutes}:${seconds}.${ms[0]}`;
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
