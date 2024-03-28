'use client';

import React, { FormEvent, useState } from "react";
import Image from "next/image";

interface Props {
  onSubmit: (content: string, language: string) => void;
}
function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const LANGUAGES = [
  'Traditional Chinese', 'Simplified Chinese', 'Spanish', 'English', 'Hindi', 'Bengali', 'Portuguese', 'Russian',
  'Japanese', 'Punjabi', 'Marathi', 'Telugu', 'Wu Chinese', 'Turkish', 'Korean',
  'French', 'German', 'Vietnamese', 'Tamil', 'Yue Chinese', 'Urdu', 'Javanese', 'Italian', 'Icelandic',
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

      // Make sure the file extension is ".srt"
      const fileName = droppedFile.name;
      const fileExtension = fileName.split(".").pop();
      if (fileExtension !== "srt") {
        alert("Please upload a .srt file");
        return;
      }

      setFile(droppedFile);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col px-4 mt-6 w-full md:px-0"
    >
      <label
        htmlFor="srt-file"
        className="block font-bold py-4 md:pl-8 text-lg text-[#444444]"
      >
        {file ? "✅" : "👉"} Step 1: Choose your SRT file
      </label>
      <div
        id="srt-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 ${dragging ? "border-blue-300" : "border-transparent"
          } md:rounded-lg bg-[#EFEFEF] px-12 relative`}
      >
        <input
          type="file"
          accept=".srt"
          onChange={(e) => setFile(e.target.files![0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div
          className={classNames(
            "grid items-center",
            file ? "md:py-4" : "md:grid-cols-2"
          )}
        >
          {!file && (
            <div className="hidden relative -bottom-8 mx-auto md:block">
              <Image
                src="/fire-chicken.png"
                alt="Chicken on fire"
                width={256}
                height={400}
                priority
              />
            </div>
          )}
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

      {file && (
        <>
          <div>
            <label
              htmlFor="srt-file"
              className="block font-bold md:pl-8 mt-6 md:mt-2 py-4 text-lg text-[#444444]"
            >
              {language ? "✅" : "👉"} Step 2: Select a Target language
            </label>
            <div className="rounded-lg bg-[#fafafa] text-[#444444] py-4 md:py-8 md:px-8 relative md:flex items-center text-center md:text-left">
              <div>Translate this SRT file to</div>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 mt-4 ml-2 bg-white rounded-lg border border-gray-300 md:mt-0"
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
          </div>
          <button
            disabled={!file || !language}
            className="bg-[#444444] hover:bg-[#3a3a3a] text-white mt-6 font-bold py-2 px-6 rounded-lg disabled:bg-[#eeeeee] disabled:text-[#aaaaaa]"
          >
            Translate {language ? `to ${language}` : `SRT`} &rarr;
          </button>
        </>
      )}
    </form>
  );
};

export default SrtForm;
