import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import "./me.css";

export const metadata: Metadata = {
  icons: {
    icon: "/brand/avrxt-selected/favicon.ico",
  },
};

export default function MeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}>{children}</div>;
}
