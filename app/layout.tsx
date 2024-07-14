import type { Metadata } from "next";
import { inter, raleway, questrial } from './fonts';
import "./globals.css";

export const metadata: Metadata = {
  title: "Proglance",
  description: "Proglance Description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${raleway.variable} ${questrial.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
