import React, { FormEvent, useState } from "react";
import Image from "next/image";

interface Props {
  onSubmit: (content: string, language: string) => void;
}

const LANGUAGES = [
  "Arabic",
  "English",
  "French",
  "German",
  "Malay",
  "Spanish",
  "Turkish",
];

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

const SrtForm: React.FC<Props> = ({ onSubmit }) => {
  const [file, setFile] = useState<File>();
  const [language, setLanguage] = useState<string>("");
  const [dragging, setDragging] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (file && language) {
      const content = await readFileContents(file);
      onSubmit(content, language);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/x-subrip") {
        setFile(droppedFile);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full px-4 mt-6 space-y-4 md:px-0"
    >
      <label
        htmlFor="srt-file"
        className="block font-bold md:pl-8 text-lg text-[#444444]"
      >
        Step 1: Choose your SRT file
      </label>
      <div
        id="srt-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 ${
          dragging ? "border-blue-300" : "border-transparent"
        } md:rounded-lg bg-[#EFEFEF] px-12 relative`}
      >
        <input
          type="file"
          accept=".srt"
          onChange={(e) => setFile(e.target.files![0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="grid items-center md:grid-cols-2">
          <div className="relative hidden mx-auto -bottom-8 md:block">
            <Image
              src="/fire-chicken.png"
              alt="Chicken on fire"
              width={256}
              height={400}
              priority
            />
          </div>
          <div>
            <div className="text-center py-4 md:py-0 text-[#444444]">
              {file ? (
                `📂 ${file.name}`
              ) : (
                <>
                  <div className="hidden md:block">
                    <div>Drop it like it&lsquo;s hot</div>
                    <div className="my-3 text-sm">- or -</div>
                  </div>
                  <div className="rounded-sm bg-[#d9d9d9] py-2 px-2">
                    Browse for SRT file&hellip;
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:h-6"></div>

      <label
        htmlFor="srt-file"
        className="block font-bold md:pl-8 text-lg text-[#444444]"
      >
        Step 2: Select a Target language
      </label>
      <div className="rounded-lg bg-[#fafafa] text-[#444444] py-4 md:py-8 md:px-8 relative md:flex items-center text-center md:text-left">
        <div>Translate this SRT file to</div>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 mt-4 ml-2 bg-white border border-gray-300 rounded-lg md:mt-0"
        >
          <option value="">Choose language&hellip;</option>
          {LANGUAGES.map((lang, i) => (
            <option key={i} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div className="h-2"></div>

      <button
        disabled={!file || !language}
        className="bg-[#444444] hover:bg-[#3a3a3a] text-white mt-6 font-bold py-2 px-6 rounded-lg disabled:bg-[#eeeeee] disabled:text-[#aaaaaa]"
      >
        Translate {language ? `to ${language}` : `SRT`} &rarr;
      </button>
    </form>
  );
};

export default SrtForm;
