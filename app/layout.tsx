import type { Metadata } from 'next'
import { Merriweather } from "next/font/google";
import './globals.css'

export const metadata: Metadata = {
  title: 'SRT AI Translator',
  description: 'Translate any SRT subtitle file to any language using advanced AI',
}

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const merriweather = Merriweather({ weight: ["700", "900"], subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={classNames("border-t-4 border-green-500 -pt-1", merriweather.className)}>{children}</body>
    </html>
  )
}
