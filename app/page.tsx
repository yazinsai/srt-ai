'use client';

import React from "react";

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
  const [content, setContent] = React.useState("");
  const [language, setLanguage] = React.useState("");

  async function handleSubmit(content: string, language: string) {
    const seconds = timestampToSeconds(findLastTimestampFromSRT(content));
    setSeconds(seconds);
    setContent(content);
    setLanguage(language);
    setStatus("pending");
  }

  return (
    <main
      className={classNames(
        "max-w-xl flex flex-col items-center mx-auto relative")}
    >
      <div className="aspect-square w-[50vw] rounded-full bg-hero-pattern absolute -top-1/2 -translate-y-[50px] left-1/2 -translate-x-1/2 pointer-events-none"></div>
      {status == "idle" && (
        <>
          <h1
            className={classNames(
              "px-4 text-3xl md:text-5xl text-center font-black py-6 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
            )}
          >
            Translate any SRT, <br />to any language
          </h1>

          <Form onSubmit={handleSubmit} />
        </>
      )}
      {status == "pending" && (
        <div>
          <PaymentButton seconds={seconds}>
            <input type="hidden" name="content" value={content} />
            <input type="hidden" name="language" value={language} />
          </PaymentButton>
        </div>
      )}
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