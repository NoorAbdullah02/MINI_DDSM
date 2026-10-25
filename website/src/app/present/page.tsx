import type { Metadata } from "next";
import { Deck } from "@/components/Deck";

export const metadata: Metadata = { title: "Presentation · Mini-DDSM · IEEE CSDE 2026" };

export default function Present() {
  return <Deck />;
}
