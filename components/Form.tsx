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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <label
        htmlFor="srt-file"
        className="block font-bold pl-8 text-lg text-[#444444]"
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
        } rounded-lg bg-[#EFEFEF] px-12 relative`}
      >
        <input
          type="file"
          accept=".srt"
          onChange={(e) => setFile(e.target.files![0])}
          className="absolute opacity-0 cursor-pointer inset-0"
        />
        <div className="grid grid-cols-2 items-center">
          <div className="relative mx-auto -bottom-8">
            <Image
              src="/fire-chicken.png"
              alt="Chicken on fire"
              width={256}
              height={400}
              priority
            />
          </div>
          <div>
            <div className="text-center text-[#444444]">
              {file ? (
                `📂 ${file.name}`
              ) : (
                <>
                  <div>Drop it like it&lsquo;s hot</div>
                  <div className="my-3 text-sm">- or -</div>
                  <div className="rounded-sm bg-[#d9d9d9] py-2 px-2">
                    Browse for file&hellip;
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-2"></div>

      <label
        htmlFor="srt-file"
        className="block font-bold pl-8 text-lg text-[#444444]"
      >
        Step 2: Target language
      </label>
      <div className="rounded-lg bg-[#EFEFEF] text-[#444444] py-8 px-8 relative flex items-center">
        <div>I'd like this file translated to</div>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="ml-2 bg-white py-2 px-4 border border-gray-300 rounded-lg"
        >
          <option value="">Select a language</option>
          {LANGUAGES.map((lang, i) => (
            <option key={i} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <button
        disabled={!file || !language}
        className="bg-[#444444] hover:bg-[#3a3a3a] text-white mt-6 font-bold py-2 px-6 rounded-lg disabled:bg-[#eeeeee] disabled:text-[#aaaaaa]"
      >
        Translate SRT &rarr;
      </button>
    </form>
  );
};

export default SrtForm;
