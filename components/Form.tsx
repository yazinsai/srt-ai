import React, { FormEvent, useState } from "react";

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
      className="flex flex-col items-center space-y-4"
    >
      <label htmlFor="srt-file" className="block font-bold text-xl">
        SRT file:
      </label>
      <div
        id="srt-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-64 h-32 border-2 ${
          dragging ? "border-blue-300" : "border-gray-300"
        } rounded-lg flex items-center justify-center cursor-pointer`}
      >
        {file ? (
          <p>{file.name}</p>
        ) : (
          <p className="text-center text-gray-500">
            Drag and drop an SRT file here or click to select
          </p>
        )}
        <input
          type="file"
          accept=".srt"
          onChange={(e) => setFile(e.target.files![0])}
          className="absolute opacity-0 cursor-pointer"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
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
        disabled={!file || !language}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
      >
        Translate SRT &rarr;
      </button>
    </form>
  );
};

export default SrtForm;
