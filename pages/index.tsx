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
    <div className="flex flex-col gap-y-2">
      {chunks.map((chunk, id) => (
        <Timestamp key={id} {...chunk} />
      ))}
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("idle");
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
      setStatus("busy");
      const response = await fetch("/api/translate", {
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
        </>
      )}
    </main>
  );
}
