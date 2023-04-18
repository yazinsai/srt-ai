import React from "react";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

import Form from "@/components/Form";
import Timestamp from "@/components/Timestamp";

import type { Chunk } from "@/types";

const triggerFileDownload = (filename: string, content: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
};

export default function Home() {
  const [translatedSrt, setTranslatedSrt] = React.useState("");
  const [translatedChunks, setTranslatedChunks] = React.useState<Chunk[]>([]);

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

      content += chunk;
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

  async function handleSubmit(content: string, language: string) {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({ content, language }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const content = await handleStream(response);
        const filename = `${language}.srt`;
        if (content) {
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
      console.error(
        "Error during file reading and translation request:",
        error
      );
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-between p-24">
      <Form onSubmit={handleSubmit} />
      <hr />
      Translated transcript below:
      <div className="flex flex-col gap-y-2">
        {translatedChunks.map((chunk, id) => (
          <Timestamp key={id} {...chunk} />
        ))}
      </div>
    </main>
  );
}
