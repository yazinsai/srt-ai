"use client";
/* eslint-disable react/no-unescaped-entities */

import React from "react";

import Form from "@/components/Form";
import Timestamp from "@/components/Timestamp";

import type { Chunk, Segment } from "@/types";
import { parseSegment, parseTimestamp } from "@/lib/client";

function classNames(...classes: any[]) {
	return classes.filter(Boolean).join(" ");
}

const triggerFileDownload = (filename: string, content: string) => {
	const element = document.createElement("a");
	const file = new Blob([content], { type: "text/plain" });
	element.href = URL.createObjectURL(file);
	element.download = filename;
	document.body.appendChild(element);
	element.click();
};

const TranslatePage = function ({ id }: { id: string }) {
	const [status, setStatus] = React.useState<"idle" | "busy" | "done">("busy");
	const [translatedSrt, setTranslatedSrt] = React.useState("");
	const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);
	const [progress, setProgress] = React.useState(0);
	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const [isUserScrolling, setIsUserScrolling] = React.useState(false);

	// Original content
	const [originalSegments, setOriginalSegments] = React.useState<Segment[]>([]);

	const fetchContent = React.useCallback(async () => {
		try {
			const response = await fetch("/api/content", {
				method: "POST",
				body: JSON.stringify({ id }),
			});

			const content = await response.text();
			setOriginalSegments(content.split(/\r\n\r\n|\n\n/).map(parseSegment));
		} catch (error) {
			console.error(
				"Error during file reading and translation request:",
				error,
			);
		}
	}, [id]);

	// TODO: When the job is done, cache it in KV so we don't have to pay on page refresh
	const submit = React.useCallback(async () => {
		try {
			setStatus("busy");
			const response = await fetch("/api", {
				method: "POST",
				body: JSON.stringify({ id }),
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const content = await handleStream(response);
				const filename = `${id}.srt`;
				if (content) {
					setStatus("done");
					triggerFileDownload(filename, content);
				} else {
					alert("Error occurred while reading the file");
				}
			} else {
				console.error(
					"Error occurred while submitting the translation request",
				);
			}
		} catch (error) {
			setStatus("idle");
			console.error(
				"Error during file reading and translation request:",
				error,
			);
		}
	}, [id]);

	React.useEffect(() => {
		submit();
		fetchContent();
	}, [fetchContent, submit]);

	const handleUserScroll = () => {
		if (scrollContainerRef.current) {
			const isAtBottom =
				scrollContainerRef.current.scrollHeight -
					scrollContainerRef.current.scrollTop ===
				scrollContainerRef.current.clientHeight;
			setIsUserScrolling(!isAtBottom);
		}
	};

	React.useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleUserScroll);
		}
		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener("scroll", handleUserScroll);
			}
		};
	}, []);

	React.useEffect(() => {
		if (!isUserScrolling && scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop =
				scrollContainerRef.current.scrollHeight;
		}
	}, [translatedChunks, isUserScrolling]);

	async function handleStream(response: Response) {
		const data = response.body;
		if (!data) return;

		let content = "";
		let doneReading = false;
		const reader = data.getReader();
		const decoder = new TextDecoder();

		function parseChunk(chunkStr: string): Chunk {
			const { id, timestamp, text } = parseSegment(chunkStr);
			const { start, end } = parseTimestamp(timestamp);
			return { index: id.toString(), start: start || '', end: end || '', text };
		}

		while (!doneReading) {
			const { value, done } = await reader.read();
			doneReading = done;
			if (value) {
				const chunk = decoder.decode(value);

				// Extract all progress updates from the chunk
				const progressMatches = chunk.matchAll(/\[PROGRESS:(\d+)\]/g);
				for (const match of progressMatches) {
					if (match[1]) {
						const newProgress = parseInt(match[1]);
						setProgress(newProgress);
						console.log('Progress update:', newProgress + '%');
					}
				}

				// Check for errors
				const errorMatch = chunk.match(/\[ERROR:(.*?)\]/);
				if (errorMatch && errorMatch[1]) {
					console.error('Translation error:', errorMatch[1]);
					setStatus('idle');
					return '';
				}

				// Remove progress and error markers, then process SRT content
				const srtContent = chunk
					.replace(/\[PROGRESS:\d+\]\n?/g, '')
					.replace(/\[ERROR:.*?\]\n?/g, '');

				if (srtContent.trim()) {
					content += srtContent;
					setTranslatedSrt((prev) => prev + srtContent);

					// Parse SRT chunks
					const segments = srtContent.split(/\r\n\r\n|\n\n/).filter(Boolean);
					for (const segment of segments) {
						if (segment.trim() && segment.includes('-->')) {
							try {
								const parsedChunk = parseChunk(segment);
								setTranslatedChunks((prev) => [...prev, parsedChunk]);
							} catch (err) {
								console.error('Error parsing chunk:', err);
							}
						}
					}
				}
			}
		}

		return content;
	}

	return (
		<main className="h-screen flex flex-col inset-0 w-full p-4 md:p-0">
			{status == "busy" && (
				<>
					<div className="max-w-2xl mx-auto text-center">
						<h1
							className={classNames(
								"px-4 text-3xl md:text-5xl text-center font-black pt-6 pb-2 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent",
							)}
						>
							Translating&hellip;
						</h1>
						<p className="text-neutral-500 mt-2">
							(The file will automatically download when it's done)
						</p>
						<p className="mt-2">
							<a
								className="underline text-blue-500"
								href={`mailto:support@translatesrt.com?subject=Need%20Help%20(Job%3A%20${id})`}
							>
								Need help?
							</a>
						</p>
						<ProgressBar
							value={progress}
							max={100}
						/>
					</div>
					<div className="flex-1 bg-neutral-50 py-8 h-full w-full">
						<div
							ref={scrollContainerRef}
							className="mx-auto max-w-6xl w-full overflow-y-scroll h-full flex flex-col gap-y-2 items-start text-neutral-600"
						>
							{translatedChunks.map((chunk, i) => (
								<div
									key={chunk.index}
									className={classNames(
										"flex flex-row w-full gap-x-3",
										i % 2 == 0 ? `bg-neutral-50` : "bg-white",
									)}
								>
					<div className="flex-1 text-right">
						{originalSegments[i]?.text || ''}
					</div>
									<div className="flex-1">{chunk.text}</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{status == "done" && (
				<div className=" max-w-2xl mx-auto text-center">
					<h1
						className={classNames(
							"px-4 text-3xl md:text-5xl text-center font-black py-6 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent",
						)}
					>
						Done!
					</h1>
					<p>(Check your &quot;Downloads&quot; folder 🍿)</p>
				</div>
			)}
		</main>
	);
};

TranslatePage.displayName = 'TranslatePage';

export default TranslatePage;

function formatPercent(value: number) {
	return `${Math.round(value * 100)}%`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
	const progress = Math.min(value / max, 1);

	return (
		<div className="w-full my-8">
			<div className="rounded-full bg-neutral-50 h-12 p-2">
				<div
					style={{ width: `${Math.max(1, progress * 100)}%` }}
					className="bg-gradient-to-r from-[#1B9639] to-[#3DDC63] rounded-l-full rounded-r-sm h-full transition-all duration-300 ease-out"
				/>
			</div>
			<p className="text-center mt-2 text-sm text-neutral-600">
				{Math.round(progress * 100)}% complete
			</p>
		</div>
	);
}
