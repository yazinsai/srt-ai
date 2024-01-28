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

export default function Home() {
  return (
    <main
      className={classNames(
        "max-w-xl flex flex-col items-center mx-auto relative")}
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
    </main>
  );
}