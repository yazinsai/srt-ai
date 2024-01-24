'use client';

import React from "react";
import { libre, roaldDahl } from "@/fonts";

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

export default function ({ content, language }: { content: string, language: string }) {
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("idle");
  const [translatedSrt, setTranslatedSrt] = React.useState("");
  const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);

  // TODO: When the job is done, cache it in KV so we don't have to pay on page refresh
  async function submit() {
    try {
      setStatus("busy");
      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify({ content, language }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const content = await handleStream(response);
        const filename = `${language}.srt`;
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
        "max-w-2xl flex flex-col items-center mx-auto",
        libre.className
      )}
    >
      {status == "busy" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-bold my-6",
              roaldDahl.className
            )}
          >
            Translating&hellip;
          </h1>
          <p>(The file will automatically download when it's done)</p>
          <Translating chunks={translatedChunks} />
        </>
      )}
      {status == "done" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-bold my-6",
              roaldDahl.className
            )}
          >
            All done!
          </h1>
          <p>Check your "Downloads" folder 🍿</p>
          <p className="mt-4 text-[#444444]">
            Psst. Need to edit your SRT? Try{" "}
            <a
              href="https://www.veed.io/subtitle-tools/edit?locale=en&source=/tools/subtitle-editor/srt-editor"
              target="_blank"
            >
              this tool
            </a>
          </p>
        </>
      )}
    </main>
  );
}