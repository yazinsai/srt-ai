import localFont from "next/font/local";
import { Libre_Baskerville } from "next/font/google";

export const roaldDahl = localFont({ src: "./RoaldDahlWonkyBold.woff" });
export const libre = Libre_Baskerville({ weight: ["700"], subsets: ["latin"] });
