import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Pre-call Brief Agent",
  description:
    "An MVP AI sales assistant: give it an account, get a grounded pre-call brief tied to real Matterport customer results. Built by Jaswanth Karjala Eshwar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteNav />
        {children}
        <footer className="mt-auto border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
            <span>
              Built by <span className="text-text">Jaswanth Karjala Eshwar</span> as an MVP for Matterport&apos;s AI Tools Manager role.
              Not affiliated with Matterport.
            </span>
            <span className="flex gap-4">
              <a className="hover:text-text" href="https://www.linkedin.com/in/jaswanth-karjala-eshwar/">LinkedIn</a>
              <a className="hover:text-text" href="https://jaswanth-karjala-eshwar.vercel.app">Portfolio</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
