import React, { FC } from "react";
import "tailwindcss/tailwind.css";
import type { Chunk } from "@/types";

const Timestamp: FC<Chunk & { originalText?: string }> = ({
	index,
	start,
	end,
	text,
	originalText,
}) => {
	const formatTimestamp = (timestamp: string) => {
		if (!timestamp) return "0:00.0";
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
			<div className="flex-grow flex gap-4 ml-4">
				{originalText && (
					<textarea
						className="flex-grow h-full bg-gray-100 p-2 rounded-lg text-gray-500"
						value={originalText}
						readOnly
					/>
				)}
				<textarea
					className="flex-grow h-full bg-gray-200 p-2 rounded-lg"
					value={text}
					readOnly
				/>
			</div>
		</div>
	);
};

export default Timestamp;
