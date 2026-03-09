'use client';

import {
  ArrowLeftIcon,
  FingerprintIcon,
  PrinterIcon,
  ScrollIcon,
  TerminalIcon,
  XIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
// import { ThemeToggle } from '../components/theme-toggle';

export default function ReportPage() {
  return (
    <main className="flex-grow flex flex-col w-full max-w-[1400px] mx-auto p-0 md:p-8 lg:p-12">
      <div className="flex flex-col border border-ink bg-paper shadow-panel print:shadow-none print:border-2">
        <div className="border-b border-ink p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <FingerprintIcon className="h-24 w-24 md:h-32 md:w-32" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/30 pb-4">
              <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Analysis_Report // #00992-ALPHA
              </span>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-alert rounded-full animate-pulse"></div>
                <span className="font-mono text-xs font-bold uppercase text-alert">
                  Confidential
                </span>
              </div>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold uppercase leading-[0.9] tracking-tighter">
              u // <br />
              Kendrick Lamar
            </h1>
            <div className="flex flex-wrap gap-y-2 gap-x-8 font-mono text-xs md:text-sm pt-2">
              <div>
                <span className="text-muted-foreground">ALBUM:</span> TO PIMP A BUTTERFLY (2015)
              </div>
              <div>
                <span className="text-muted-foreground">GENRE:</span> HIP HOP / JAZZ RAP
              </div>
              <div>
                <span className="text-muted-foreground">BPM:</span> 78
              </div>
              <div>
                <span className="text-muted-foreground">KEY:</span> A MINOR
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-ink">
          <div className="lg:col-span-5 p-8 flex flex-col gap-6">
            <h3 className="font-display text-2xl font-bold uppercase border-b border-ink pb-2">
              01 // Thesis Statement
            </h3>
            <div className="prose prose-sm prose-p:font-mono prose-p:text-justify max-w-none">
              <p className="mb-4 text-base leading-relaxed">
                <span className="bg-ink text-paper px-1 font-bold mr-1">SUMMARY:</span>
                "u" serves as the chaotic, introspective inverse to the self-celebratory anthem "i".
                Through a drunken, sobbing vocal delivery, Lamar interrogates his own survivor's
                guilt, framing his success as a failure to protect his community back in Compton.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The track utilizes a "bottle" metaphor not just for alcoholism, but for the
                containment of toxic masculinity and emotional suppression. The text is broken by
                scream-like interjections, disrupting the flow and mirroring a psychological
                breakdown.
              </p>
            </div>
            <div className="mt-auto pt-8">
              <div className="border border-ink p-4 bg-paper-dim">
                <p className="font-mono text-xs font-bold uppercase mb-2 text-muted-foreground">
                  AI_INSTRUCTOR_NOTE:
                </p>
                <p className="font-display text-lg italic leading-tight">
                  "The syntax here is deliberately fractured. Study the breaks in rhythm--they are
                  linguistic representations of the speaker's deteriorating mental state."
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 bg-paper-dim/30 flex flex-col">
            <div className="p-4 border-b border-ink">
              <h3 className="font-display text-lg font-bold uppercase">02 // Data</h3>
            </div>
            <div className="flex flex-col divide-y divide-ink/20">
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Word_Count
                </span>
                <span className="font-mono font-bold">482</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Unique_Stems
                </span>
                <span className="font-mono font-bold">156</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Complexity
                </span>
                <span className="font-mono font-bold text-alert">0.85 (HIGH)</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Rhyme_Density
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-ink"></div>
                  <div className="w-1 h-3 bg-ink"></div>
                  <div className="w-1 h-3 bg-ink"></div>
                  <div className="w-1 h-3 bg-ink"></div>
                  <div className="w-1 h-3 bg-ink/30"></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-ink mt-auto">
              <div className="aspect-square border border-ink relative bg-white p-2">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_1px,transparent_1px)] bg-[length:10px_10px] opacity-5"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-ink/20"></div>
                  <div className="h-full w-[1px] bg-ink/20 absolute"></div>
                </div>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                  <polygon
                    fill="rgba(0,0,0,0.1)"
                    points="50,10 90,50 50,90 10,50"
                    stroke="black"
                    strokeWidth="1.5"
                  ></polygon>
                  <circle cx="50" cy="10" fill="red" r="2"></circle>
                  <circle cx="90" cy="50" fill="black" r="2"></circle>
                  <circle cx="50" cy="90" fill="black" r="2"></circle>
                  <circle cx="10" cy="50" fill="black" r="2"></circle>
                </svg>
                <span className="absolute top-1 left-1 text-[9px] font-bold">AAVE</span>
                <span className="absolute bottom-1 right-1 text-[9px] font-bold">POETIC</span>
              </div>
              <p className="text-center text-[10px] uppercase mt-2 font-bold tracking-widest">
                Dialect_Map
              </p>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <div className="p-4 border-b border-ink bg-ink text-paper">
              <h3 className="font-display text-lg font-bold uppercase">03 // Idiom Decoder</h3>
            </div>
            <div className="flex-grow overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-paper-dim border-b border-ink">
                  <tr>
                    <th className="px-4 py-3 font-medium border-r border-ink w-1/3" scope="col">
                      Term
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Definition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/20">
                  <tr className="bg-paper hover:bg-paper-dim/50">
                    <td className="px-4 py-3 border-r border-ink font-bold align-top">
                      "Bottle up"
                    </td>
                    <td className="px-4 py-3 font-mono text-xs align-top">
                      To suppress emotions or keep them hidden inside, like liquid in a sealed
                      container.
                    </td>
                  </tr>
                  <tr className="bg-paper hover:bg-paper-dim/50">
                    <td className="px-4 py-3 border-r border-ink font-bold align-top">
                      "Housekeeping"
                    </td>
                    <td className="px-4 py-3 font-mono text-xs align-top">
                      Here, a metaphor for internal mental maintenance or cleaning up one's own
                      life/mess.
                    </td>
                  </tr>
                  <tr className="bg-paper hover:bg-paper-dim/50">
                    <td className="px-4 py-3 border-r border-ink font-bold align-top">
                      "Survivor's Guilt"
                    </td>
                    <td className="px-4 py-3 font-mono text-xs align-top">
                      A mental condition that occurs when a person believes they have done wrong by
                      surviving a traumatic event when others did not.
                    </td>
                  </tr>
                  <tr className="bg-paper hover:bg-paper-dim/50">
                    <td className="px-4 py-3 border-r border-ink font-bold align-top">
                      "Broken Window Theory"
                    </td>
                    <td className="px-4 py-3 font-mono text-xs align-top">
                      Implied context: Visible signs of disorder and misbehavior in an environment
                      encourage further disorder.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="border-t border-ink bg-paper p-4 flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-wider gap-4">
          <div className="flex items-center gap-2">
            <ScrollIcon className="h-4 w-4" aria-hidden="true" />
            <span>Archived by User_882</span>
          </div>
          <div className="h-px w-full md:w-32 bg-ink/20"></div>
          <div className="flex items-center gap-4">
            <span>Session: XJ-992-ALPHA</span>
            <span className="bg-ink text-paper px-2 py-0.5 font-bold">2023-10-27 14:02 UTC</span>
          </div>
        </div>
        <div className="h-2 w-full flex">
          <div className="h-full w-1/4 bg-black"></div>
          <div className="h-full w-1/4 bg-gray-500"></div>
          <div className="h-full w-1/4 bg-gray-300"></div>
          <div className="h-full w-1/4 bg-paper-dim"></div>
        </div>
      </div>
      <div className="mt-8 mb-12 text-center no-print">
        <Link
          href="/index"
          className="inline-flex items-center gap-2 text-sm font-mono hover:underline hover:text-alert transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          RETURN TO INDEX
        </Link>
      </div>
    </main>
  );
}
