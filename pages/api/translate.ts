// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const stripSRT = (srt: string) => {
  const regex =
    /(\d+)\s*\n(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n([\s\S]*?)(?=\n{2}\d+\s*\n|\n*$)/g;
  const timestamps: string[] = [];
  const texts: string[] = [];

  srt.replace(regex, (_match, _index, start, end, text) => {
    timestamps.push(`${start} --> ${end}`);
    texts.push(text.trim());
    return "";
  });

  return { timestamps, textContent: texts.join("|") };
};

const reconstructSRT = (timestamps: string[], translatedText: string) => {
  const translatedLines = translatedText.split(" | ");
  let srt = "";

  for (let i = 0; i < timestamps.length; i++) {
    srt += `${i + 1}\n${timestamps[i]}\n${translatedLines[i]}\n\n`;
  }

  return srt;
};

const processTranslation = async (text: string, language: string) => {
  const prompt = `Translate to ${language}, making sure to preserve the meaning (without doing a literal translation). Keep the "|"s:`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer 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`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `The text to be translated is: ${text}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.0,
    }),
  });

  if (res.status !== 200) {
    console.log(res);
    throw new Error("OpenAI API returned an error");
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Invalid request method" });

  try {
    const { content, language } = req.body;
    console.log(content, language);

    const { timestamps, textContent } = stripSRT(content);
    const translatedText = await processTranslation(textContent, language);
    const translatedSrt = reconstructSRT(timestamps, translatedText);
    res.status(200).json({ translatedSrt });
  } catch (error) {
    console.error("Error during translation:", error);
    res.status(500).json({ error: "Error during translation" });
  }
}
