// src/components/SrtForm.tsx
import React, { FormEvent, useState } from "react";

interface Props {
  onSubmit: (content: string, language: string) => void;
}

const LANGUAGES = ["Arabic", "English", "Spanish", "French", "German"];

// src/utils/fileReader.ts
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (file && language) {
      const content = await readFileContents(file);
      onSubmit(content, language);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center space-y-4"
    >
      <label htmlFor="srt-file" className="block font-bold text-xl">
        SRT file:
      </label>
      <input
        type="file"
        id="srt-file"
        accept=".srt"
        onChange={(e) => setFile(e.target.files![0])}
        className="bg-white py-2 px-4 border border-gray-300 rounded-lg"
      />
      <label htmlFor="language" className="block font-bold text-xl">
        Language:
      </label>
      <select
        id="language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-white py-2 px-4 border border-gray-300 rounded-lg"
      >
        <option value="">Select a language</option>
        {LANGUAGES.map((lang, i) => (
          <option key={i} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!file || !language}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
      >
        Translate SRT &rarr;
      </button>
    </form>
  );
};

export default SrtForm;
