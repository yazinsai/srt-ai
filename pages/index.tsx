import Image from "next/image";
import { Inter } from "next/font/google";
import Form from "@/components/Form";

const inter = Inter({ subsets: ["latin"] });

const triggerFileDownload = (filename: string, content: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
};

export default function Home() {
  async function handleSubmit(content: string, language: string) {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({ content, language }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const translatedSrt = data.translatedSrt;
        const filename = `${language}.srt`;
        triggerFileDownload(filename, translatedSrt);
        console.log("Translation result:", data);
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Form onSubmit={handleSubmit} />
    </main>
  );
}
