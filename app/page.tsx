'use client';

import React from "react";
import Form from "@/components/Form";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  return (
    <main
      className={classNames(
        "max-w-4xl flex flex-col items-center mx-auto relative")}
    >
      <div className="aspect-square w-[50vw] rounded-full bg-hero-pattern absolute -top-1/2 -translate-y-[50px] left-1/2 -translate-x-1/2 pointer-events-none"></div>

      <h1
        className={classNames(
          "px-4 text-3xl md:text-5xl text-center font-black py-6 bg-gradient-to-b from-[#1B9639] to-[#3DDC63] bg-clip-text text-transparent"
        )}
      >
        Translate any SRT, <br />to any language
      </h1>

      <Form />

      <div className="py-36">
        <FeatureSections />
      </div>
    </main>
  );
}

function FeatureSections() {
  return (
    <div className="flex flex-col gap-y-16">
      <div className="flex flex-row gap-x-12 items-center">
        <div className="flex-1">
          <img src="/book-open.png" className="w-full" />
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-neutral-800">From any language, to any language.</h2>
          <p className="mt-6 text-neutral-600 leading-relaxed">While most tools can only translate from English, SRT-ai allows you to translate from & to over 100+ languages, including Swahili.</p>
        </div>
      </div>

      <div className="flex flex-row md:flex-row-reverse gap-x-12 items-center">
        <div className="flex-1">
          <img src="/better-ga.png" className="w-full p-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-neutral-800">Infinitely better than Google Translate.</h2>
          <p className="mt-6 text-neutral-600 leading-relaxed">We don’t translate individual segments. Instead, the entire dialogue is translated, maintaining important contextual cues to achieve better results. This is achieved using the latest GPT-4 model,  achieving better-than-human-level accuracy, instantly.</p>
        </div>
      </div>

      <div className="flex flex-row gap-x-12 items-center">
        <div className="flex-1">
          <img src="/pricing.png" className="w-full p-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-neutral-800">Unbeatable price: just $1/hr</h2>
          <p className="mt-6 text-neutral-600 leading-relaxed">Most tools charge several $'s per minute, and then a little extra for tracking the timestamps. Our pricing is simple: just $1/hour.</p>
        </div>
      </div>
    </div>
  )
}