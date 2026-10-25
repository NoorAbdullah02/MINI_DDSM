import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const title = "Multi-Backbone Ensemble Learning on Mini-DDSM · IEEE CSDE 2026";
const description =
  "Patient-grouped, leakage-audited breast cancer classification on Mini-DDSM with an EfficientNet-B4 + ConvNeXtV2-Tiny ensemble. ROC-AUC 0.891 across three repeated seeds.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Sheikh Noor Abdullah" }],
  keywords: ["mammography", "breast cancer", "Mini-DDSM", "deep learning", "ensemble", "IEEE CSDE 2026"],
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#fbfaf7" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
