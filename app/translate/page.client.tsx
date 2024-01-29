'use client';

import React from "react";

import Form from "@/components/Form";
import Timestamp from "@/components/Timestamp";

import type { Chunk } from "@/types";

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

function Translating({ chunks }: { chunks: Chunk[] }) {
  return (
    <div className="flex gap-y-2 flex-col-reverse">
      {chunks.map((chunk, id) => (
        <Timestamp key={id} {...chunk} />
      ))}
    </div>
  );
}

export default function ({ id }: { id: string }) {
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("busy");
  const [translatedSrt, setTranslatedSrt] = React.useState("");
  const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);

  // Original content
  const [content, setContent] = React.useState<string>("");
  const [maxSegments, setMaxSegments] = React.useState<number>(0);

  async function fetchContent() {
    try {
      const response = await fetch(`/api/content`, { method: "POST", body: JSON.stringify({ id }) });
      const content = await response.text()
      setContent(content);
      setMaxSegments(content.split(/\r\n\r\n|\n\n/).length);
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
    <main
      className={classNames(
        "max-w-2xl flex flex-col items-center mx-auto"
      )}
    >
      {status == "busy" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-black pt-6 pb-2 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
            )}
          >
            Translating&hellip;
          </h1>
          <p className="text-neutral-500">(The file will automatically download when it's done)</p>
          <ProgressBar value={translatedChunks.length} max={maxSegments} />
          <Translating chunks={translatedChunks} />
        </>
      )}
      {status == "done" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-black py-6 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
            )}
          >
            Done!
          </h1>
          <p>(Check your "Downloads" folder 🍿)</p>
        </>
      )}
    </main>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="my-12 w-full rounded-full bg-neutral-50 h-12 p-2">
      <div
        style={{ width: formatPercent(value / max) }}
        className="bg-gradient-to-r from-[#1B9639] to-[#3DDC63] rounded-full h-full"
      ></div>
    </div>
  );
}