'use client';

import React from "react";

import Form from "@/components/Form";
import Timestamp from "@/components/Timestamp";

import type { Chunk, Segment } from "@/types";
import { parseSegment } from "@/lib/client";

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

export default function ({ id }: { id: string }) {
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("busy");
  const [translatedSrt, setTranslatedSrt] = React.useState("");
  const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);

  // Original content
  const [originalSegments, setOriginalSegments] = React.useState<Segment[]>([]);

  async function fetchContent() {
    try {
      const response = await fetch(`/api/content`, { method: "POST", body: JSON.stringify({ id }) });

      const content = await response.text()
      setOriginalSegments(content.split(/\r\n\r\n|\n\n/).map(parseSegment));
    } catch (error) {
      console.error(
        "Error during file reading and translation request:",
        error
      );
    }
  }

  // TODO: When the job is done, cache it in KV so we don't have to pay on page refresh
  async function submit() {
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
          "Error occurred while submitting the translation request"
        );
      }
    } catch (error) {
      setStatus("idle");
      console.error(
        "Error during file reading and translation request:",
        error
      );
    }
  }

  React.useEffect(() => {
    submit();
    fetchContent();
  }, [])

  async function handleStream(response: any) {
    const data = response.body;
    if (!data) return;

    let content = "";
    let doneReading = false;
    const reader = data.getReader();
    const decoder = new TextDecoder();

    while (!doneReading) {
      const { value, done } = await reader.read();
      doneReading = done;
      const chunk = decoder.decode(value);

      content += chunk + "\n\n";
      setTranslatedSrt((prev) => prev + chunk);
      if (chunk.trim().length)
        setTranslatedChunks((prev) => [...prev, parseChunk(chunk)]);
    }

    return content;

    function parseChunk(chunkStr: string): Chunk {
      const [index, timestamps, text] = chunkStr.split("\n");
      const [start, end] = timestamps.split(" --> ");
      return { index, start, end, text };
    }
  }

  return (
    <main className="h-screen flex flex-col inset-0 w-full p-4 md:p-0">
      {status == "busy" && (
        <>
          <div className="max-w-2xl mx-auto text-center">
            <h1
              className={classNames(
                "px-4 text-3xl md:text-5xl text-center font-black pt-6 pb-2 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
              )}
            >
              Translating&hellip;
            </h1>
            <p className="text-neutral-500 mt-2">(The file will automatically download when it's done)</p>
            <ProgressBar value={translatedChunks.length} max={originalSegments.length} />
          </div>
          <div className="flex-1 bg-neutral-50 py-8 h-full w-full">
            <div className="mx-auto max-w-6xl w-full overflow-y-scroll h-full flex flex-col-reverse gap-y-2 items-start text-neutral-600">
              {translatedChunks.map((chunk, i) => (
                <div className={classNames("flex flex-row w-full gap-x-3", i % 2 == 0 ? `bg-neutral-50` : 'bg-white')}>
                  <div className="flex-1 text-right">{originalSegments[i].text}</div>
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
              "px-4 text-3xl md:text-5xl text-center font-black py-6 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
            )}
          >
            Done!
          </h1>
          <p>(Check your "Downloads" folder 🍿)</p>
        </div>
      )}
    </main>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const progress = value > 0 ? value / max : 0;

  return (
    <div className="my-12 w-full rounded-full bg-neutral-50 h-12 p-2">
      <div
        style={{ width: formatPercent(progress) }}
        className="bg-gradient-to-r from-[#1B9639] to-[#3DDC63] rounded-l-full rounded-r-sm h-full"
      ></div>
    </div>
  );
}