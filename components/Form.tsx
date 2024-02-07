'use client';

import React, { FormEvent, useState } from "react";
import Image from "next/image";
import { parseSegment } from "@/lib/client";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const LANGUAGES = [
  'Mandarin Chinese', 'Spanish', 'English', 'Hindi', 'Bengali', 'Portuguese', 'Russian',
  'Japanese', 'Punjabi', 'Marathi', 'Telugu', 'Wu Chinese', 'Turkish', 'Korean',
  'French', 'German', 'Vietnamese', 'Tamil', 'Yue Chinese', 'Urdu', 'Javanese', 'Italian',
  'Arabic', 'Gujarati', 'Persian', 'Bhojpuri', 'Min Nan', 'Hakka',
  'Jin Chinese', 'Hausa', 'Kannada', 'Indonesian', 'Polish', 'Yoruba', 'Xiang Chinese',
  'Malayalam', 'Odia', 'Maithili', 'Burmese', 'Sunda', 'Ukrainian',
  'Igbo', 'Uzbek', 'Sindhi', 'Romanian', 'Tagalog', 'Dutch', 'Estonian',
  'Danish', 'Finnish', 'Norwegian', 'Swedish',
  'Amharic', 'Pashto', 'Magahi', 'Thai', 'Saraiki', 'Khmer',
  'Somali', 'Malay', 'Cebuano', 'Nepali', 'Assamese', 'Sinhalese',
  'Kurdish', 'Fulfulde', 'Greek', 'Chittagonian', 'Kazakh', 'Hungarian',
  'Kinyarwanda', 'Zulu', 'Czech', 'Uyghur', 'Hmong', 'Shona',
  'Quechua', 'Belarusian', 'Balochi', 'Konkani', 'Armenian', 'Azerbaijani',
  'Bashkir', 'Luxembourgish', 'Tibetan', 'Tigrinya', 'Turkmen', 'Kashmiri',
  'Malagasy', 'Kirghiz', 'Tatar', 'Tonga', 'Tswana', 'Esperanto'
].sort()

const readFileContents = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = (e) => {
      reject(e);
    };

    reader.readAsText(file);
  });
};

const SrtForm: React.FC = () => {
  const [file, setFile] = useState<File>();
  const [language, setLanguage] = useState<string>("");
  const [dragging, setDragging] = useState<boolean>(false);
  const fileElement = React.useRef<null | HTMLInputElement>(null);

  const [content, setContent] = useState<string>("");
  const [seconds, setSeconds] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false); // prevent double-clicks

  const updateFile = async (file: File) => {
    setFile(file);
    const content = await readFileContents(file);
    setContent(content);

    // Update prices
    const seconds = timestampToSeconds(findLastTimestampFromSRT(content));
    setSeconds(seconds);
    const amount = Math.ceil(seconds / 3600) * 100; // $1/hr, min $1
    setAmount(amount);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Make sure the file extension is ".srt"
      const fileName = droppedFile.name;
      const fileExtension = fileName.split(".").pop();
      if (fileExtension !== "srt") {
        alert("Please upload a .srt file");
        return;
      }

      updateFile(droppedFile);
    }
  };

  function handleSubmit() {
    setBusy(true);
    return true; // allow form submission
  }

  return (
    <form
      className="flex flex-col px-4 mt-6 w-full md:px-0 relative" action={'/api/pay'} method='POST' onSubmit={handleSubmit}>
      <input type="hidden" name="seconds" value={seconds} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="language" value={language} />

      <input
        type="file"
        ref={fileElement}
        accept=".srt"
        onChange={(e) => updateFile(e.target.files![0])}
        className="hidden"
      />

      {!file && (
        <div
          id="srt-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full ${file ? "" : "border-4"} ${dragging ? "border-green-300" : "border-green-500 border-dashed"
            } md:rounded-lg relative`}
        >
          <div>
            <div className="py-4 md:py-0">
              <div className="py-4 md:py-24 text-center text-neutral-600">
                <div className="hidden md:block">
                  <div>Drop any SRT file</div>
                  <div className="my-3 text-sm">- or -</div>
                </div>
                <div className="rounded-sm bg-green-500 text-neutral-50 py-2 px-2 max-w-[200px] mx-auto cursor-pointer" onClick={() => fileElement?.current?.click()}>
                  Browse
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {file && (
        <>
          <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3">
            {/* first row */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#F0FDF4" />
              <path d="M6 11.6L10.2 15.8L18 8" stroke="#22C55E" strokeWidth="2" />
            </svg>
            <div className="text-neutral-600">Select an SRT file</div>

            {/* second row */}
            <div>
              <div className="h-full border-r border-dashed border-neutral-200 w-0 mx-auto my-1"></div>
            </div>
            <div className="mt-3 mb-10 text-neutral-500 font-normal cursor-pointer" onClick={() => fileElement?.current?.click()}>{file.name}</div>

            {/* third row */}
            {language ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:place-self-center">
                <circle cx="12" cy="12" r="12" fill="#F0FDF4" />
                <path d="M6 11.6L10.2 15.8L18 8" stroke="#22C55E" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:place-self-center">
                <circle cx="12" cy="12" r="11.5" fill="#FEFCE8" stroke="#FEFCE8" />
                <path d="M5 11.8H17.6M17.6 11.8L12.8 7M17.6 11.8L12.8 16.6" stroke="#EAB308" strokeWidth="2" />
              </svg>
            )}
            <div className="flex flex-col md:gap-x-3 gap-y-3 md:flex-row md:items-center text-neutral-600">
              <div>
                Choose target language
              </div>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2 py-1.5 bg-white rounded-md border border-gray-300 md:mt-0 font-normal"
              >
                <option value="">Choose language&hellip;</option>
                {LANGUAGES.map((lang, i) => (
                  <option key={i} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {language && (
              <>
                <div className="border-r border-dashed border-neutral-200 w-0 mx-auto my-1 h-10"></div>
                <div></div>

                {/* payment row */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:place-self-center">
                  <circle cx="12" cy="12" r="11.5" fill="#FEFCE8" stroke="#FEFCE8" />
                  <path d="M5 11.8H17.6M17.6 11.8L12.8 7M17.6 11.8L12.8 16.6" stroke="#EAB308" strokeWidth="2" />
                </svg>
                <div className="text-neutral-600">
                  Complete payment
                </div>

                <div></div>
                <div className="text-neutral-500 mt-3 font-normal">We charge only $1/hour of translation, minimum charge is $1.</div>

                {/* payment row */}
                <div></div>
                <button
                  disabled={!file || !language || busy}
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 text-white mt-6 font-bold py-2 px-6 rounded-md disabled:bg-[#eeeeee] disabled:text-[#aaaaaa] col-span-2 md:col-span-1"
                >
                  Pay {formatUSD(amount / 100)} to translate (instant)
                </button>
              </>
            )}
          </div>

        </>
      )}
    </form >
  );
};

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

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default SrtForm;
