import Image from "next/image";
import { Inter } from "next/font/google";
import Form from "@/components/Form";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  function handleSubmit(file: File, language: string) {
    console.log("Submitted", file, language);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Form onSubmit={handleSubmit} />
    </main>
  );
}
