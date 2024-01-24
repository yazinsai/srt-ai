'use client';

import React from "react";
import { libre, roaldDahl } from "@/fonts";

import Form from "@/components/Form";
import Timestamp from "@/components/Timestamp";

import type { Chunk } from "@/types";
import PaymentButton from "@/components/PaymentButton";
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

function Translating({ chunks }: { chunks: Chunk[] }) {
  return (
    <div className="flex gap-y-2 flex-col-reverse">
      {chunks.map((chunk, id) => (
        <Timestamp key={id} {...chunk} />
      ))}
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = React.useState<"idle" | "pending">("idle");
  const [seconds, setSeconds] = React.useState(0);
  // const [translatedSrt, setTranslatedSrt] = React.useState("");
  // const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);

  // async function handleStream(response: any) {
  //   const data = response.body;
  //   if (!data) return;

  //   let content = "";
  //   let doneReading = false;
  //   const reader = data.getReader();
  //   const decoder = new TextDecoder();

  //   while (!doneReading) {
  //     const { value, done } = await reader.read();
  //     doneReading = done;
  //     const chunk = decoder.decode(value);

  //     content += chunk + "\n\n";
  //     setTranslatedSrt((prev) => prev + chunk);
  //     if (chunk.trim().length)
  //       setTranslatedChunks((prev) => [...prev, parseChunk(chunk)]);
  //   }

  //   return content;

  //   function parseChunk(chunkStr: string): Chunk {
  //     const [index, timestamps, text] = chunkStr.split("\n");
  //     const [start, end] = timestamps.split(" --> ");
  //     return { index, start, end, text };
  //   }
  // }

  async function handleSubmit(content: string, language: string) {
    const seconds = timestampToSeconds(findLastTimestampFromSRT(content));
    setSeconds(seconds);
    setStatus("pending");
  }

  return (
    <main
      className={classNames(
        "max-w-2xl flex flex-col items-center mx-auto",
        libre.className
      )}
    >
      {status == "idle" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-bold my-6",
              roaldDahl.className
            )}
          >
            Translate any SRT, to any language
          </h1>
          <Form onSubmit={handleSubmit} />
        </>
      )}
      {status == "pending" && (
        <div>
          <PaymentButton seconds={seconds} />
        </div>
      )}
      {/* {status == "busy" && (
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
      )} */}
    </main>
  );
}

function findLastTimestampFromSRT(content: string) {
  const segments = content.split(/\r\n\r\n|\n\n/); // \r\n for Windows, \n for Unix

  // Find the last timestamp with a valid id
  for (let i = segments.length - 1; i > 0; i--) {
    if (!segments[i] || segments[i].trim().length === 0) continue; // skip empty lines (e.g. at the end of the file

    const { id, timestamp } = parseSegment(segments[i]);
    if (isNaN(id)) continue;

    const [start, end] = timestamp.split(" --> ");
    return end.trim();
  }

  throw new Error("No valid timestamp found");
}

function timestampToSeconds(timestamp: string) {
  // convert hh:mm:ss,mmm to seconds
  const [hh, mm, ss] = timestamp.split(":");
  const [ss2, mmm] = ss.split(",");
  return (
    parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss2) + parseInt(mmm) / 1000
  );
}