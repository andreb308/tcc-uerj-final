'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChatCircleDotsIcon,
  FingerprintIcon,
  ScrollIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import type { ReportRecord } from '@/lib/schemas/report';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-400 rounded-md ${className}`} />;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  // const { messages, sendMessage } = useChat();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery<ReportRecord>({
    queryKey: ['report', id],
    queryFn: async () => {
      const res = await fetch(`/api/report/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch report');
      }
      return res.json();
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <main className="grow flex flex-col w-full max-w-[1400px] mx-auto p-0 md:p-8 lg:p-12">
        <div className="flex flex-col border border-ink bg-background shadow-panel print:shadow-none print:border-2">
          {/* Header Skeleton */}
          <div className="border-b border-ink p-8 md:p-12 relative overflow-hidden">
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/30 pb-4">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-ink/20 rounded-full animate-pulse"></div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-16 w-64 md:h-24 md:w-96" />
                  <Skeleton className="h-16 w-48 md:h-24 md:w-72" />
                </div>
                <Skeleton className="h-16 w-64 md:h-16 md:w-64" />
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-8 pt-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-ink">
            {/* Section 01 */}
            <div className="lg:col-span-5 p-8 flex flex-col gap-6">
              <h3 className="font-display text-2xl font-bold uppercase border-b border-ink pb-2">
                01 // Thesis Statement
              </h3>
              <div className="flex flex-col gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="mt-auto pt-8">
                <div className="border border-ink p-4 bg-paper-dim">
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4 mt-2" />
                </div>
              </div>
            </div>

            {/* Section 02 */}
            <div className="lg:col-span-3 bg-paper-dim/30 flex flex-col">
              <div className="p-4 border-b border-ink">
                <h3 className="font-display text-lg font-bold uppercase">02 // Data</h3>
              </div>
              <div className="flex flex-col divide-y divide-ink/20">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-ink mt-auto">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-3 w-24 mx-auto mt-2" />
              </div>
            </div>

            {/* Section 03 */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="p-4 border-b border-ink bg-ink">
                <h3 className="font-display text-lg font-bold uppercase">03 // Idiom Decoder</h3>
              </div>
              <div className="grow p-4 flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-1/3 shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="border-t border-ink bg-paper p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <Skeleton className="h-4 w-48" />
            <div className="h-px w-full md:w-32 bg-ink/20"></div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !report || !report.reportData) {
    return (
      <main className="grow flex flex-col items-center justify-center w-full max-w-[1400px] mx-auto p-8">
        <div className="text-center font-mono">
          <h2 className="text-2xl font-bold uppercase mb-4 text-alert">Error Loading Report</h2>
          <p className="text-muted-foreground">
            {error?.message || 'Report data is incomplete or missing.'}
          </p>
          <Link
            href="/index"
            className="mt-8 inline-block hover:underline hover:text-alert transition-colors"
          >
            <ArrowLeftIcon className="inline mr-2" aria-hidden="true" /> RETURN TO INDEX
          </Link>
        </div>
      </main>
    );
  }

  const reportData = report.reportData;

  const sendMessageTest = () => {
    console.log('sendMessageTest clicked');

    // sendMessage({
    //   text: JSON.stringify({
    //     artist: 'Taylor Swift',
    //     song: 'cowboy like me',
    //     lyric: `Perched in the dark
    //             Tellin' all the rich folks anything they wanna hear
    //             Like it could be love
    //             I could be the way forward
    //             Only if they pay for it
    //             You're a bandit like me
    //             Eyes full of stars
    //             Hustling for the good life, never thought I'd meet you here
    //             It could be love
    //             We could be the way forward
    //             And I know I'll pay for it`,
    //   }),
    // });
  };

  // useEffect(() => {
  //   if (!messages.length) return;
  //   const latest = messages[messages.length - 1];
  //   if (latest.role !== 'assistant') return;

  //   console.clear();
  //   const reasoning = latest.parts
  //     ?.filter((p) => p.type === 'reasoning')
  //     .map((p) => ('text' in p ? (p.text as string) : ''));
  //   const text = latest.parts
  //     ?.filter((p) => p.type === 'text')
  //     .map((p) => ('text' in p ? (p.text as string) : ''));

  //   if (reasoning?.length)
  //     console.log('%c[REASONING]', 'color: orange; font-weight: bold', reasoning.join('\n'));
  //   if (text?.length)
  //     console.log('%c[RESPONSE]', 'color: lime; font-weight: bold', text.join('\n'));
  // }, [messages]);

  // -- Dialect map SVG helpers --
  const mapPoints = reportData.dataMetrics.dialectMap;
  const angleStep = (2 * Math.PI) / mapPoints.length;
  // Offset by -π/2 so the first axis points up
  const toXY = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * 40; // max radius 40 in a 100x100 viewBox
    return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
  };
  const polygonPoints = mapPoints
    .map((p, i) => {
      const { x, y } = toXY(p.value, i);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <main className="grow flex flex-col w-full max-w-[1400px] mx-auto p-0 md:p-8 lg:p-12">
      <div className="flex flex-col border border-ink bg-background shadow-panel print:shadow-none print:border-2">
        {/* ── Header ── */}
        <div className="border-b border-ink p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <FingerprintIcon className="h-24 w-24 md:h-32 md:w-32" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/30 pb-4">
              <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Analysis_Report // {report.id}
              </span>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-alert rounded-full animate-pulse"></div>
                <span className="font-mono text-xs font-bold uppercase text-alert">
                  Confidential
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h1 className="font-display text-5xl md:text-7xl font-bold uppercase leading-[0.9] tracking-tighter">
                {report.trackTitle} // <br />
                {report.artist}
              </h1>
              <Link
                href="#"
                onClick={() => sendMessageTest()}
                className="print:hidden group inline-flex shrink-0 items-center gap-3 border-2 border-foreground bg-primary px-8 py-5 font-display text-base font-bold uppercase tracking-[2.5px] text-primary-foreground transition-all duration-150 hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_black]"
              >
                <ChatCircleDotsIcon
                  className="size-6 transition-transform duration-150 group-hover:scale-110"
                  weight="bold"
                  aria-hidden="true"
                />
                Start Conversation
                <ArrowRightIcon
                  className="size-5 transition-transform duration-150 group-hover:translate-x-1"
                  weight="bold"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="flex flex-wrap gap-y-2 gap-x-8 font-mono text-xs md:text-sm pt-2">
              <div>
                <span className="text-muted-foreground">ALBUM:</span> {reportData.metadata.album}
              </div>
              <div>
                <span className="text-muted-foreground">GENRE:</span> {reportData.metadata.genre}
              </div>
              <div>
                <span className="text-muted-foreground">YEAR:</span> {reportData.metadata.year}
              </div>
              <div>
                <span className="text-muted-foreground">KEY:</span> {reportData.metadata.musicalKey}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-ink">
          {/* Section 01 — Thesis */}
          <div className="lg:col-span-5 p-8 flex flex-col gap-6">
            <h3 className="font-display text-2xl font-bold uppercase border-b border-ink pb-2">
              01 // Thesis Statement
            </h3>
            <div className="prose prose-sm prose-p:font-mono prose-p:text-justify max-w-none">
              <p className="mb-4 text-base leading-relaxed">
                <span className="bg-ink px-1 font-bold mr-1">SUMMARY:</span>
                {reportData.thesis.summary}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reportData.thesis.extendedAnalysis}
              </p>
            </div>
            <div className="mt-auto pt-8">
              <div className="border border-ink p-4 bg-paper-dim">
                <p className="font-mono text-xs font-bold uppercase mb-2 text-muted-foreground">
                  AI_INSTRUCTOR_NOTE:
                </p>
                <p className="font-display text-lg italic leading-tight">
                  {reportData.thesis.instructorNote}
                </p>
              </div>
            </div>
          </div>

          {/* Section 02 — Data */}
          <div className="lg:col-span-3 bg-paper-dim/30 flex flex-col">
            <div className="p-4 border-b border-ink">
              <h3 className="font-display text-lg font-bold uppercase">02 // Data</h3>
            </div>
            <div className="flex flex-col divide-y divide-ink/20">
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Word_Count
                </span>
                <span className="font-mono font-bold">{reportData.dataMetrics.wordCount}</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Unique_Stems
                </span>
                <span className="font-mono font-bold">{reportData.dataMetrics.uniqueStems}</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Complexity
                </span>
                <span className="font-mono font-bold text-alert">
                  {reportData.dataMetrics.complexity} ({reportData.dataMetrics.complexityLabel})
                </span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-white transition-colors group">
                <span className="text-xs uppercase font-bold text-muted-foreground group-hover:text-ink">
                  Rhyme_Density
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-3 ${i < reportData.dataMetrics.rhymeDensity ? 'bg-ink' : 'bg-ink/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Dialect Map */}
            <div className="p-4 border-t border-ink mt-auto">
              <div className="aspect-square border border-ink relative bg-white p-2">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_1px,transparent_1px)] bg-size-[10px_10px] opacity-5"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-ink/20"></div>
                  <div className="h-full w-px bg-ink/20 absolute"></div>
                </div>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                  <polygon
                    fill="rgba(0,0,0,0.1)"
                    points={polygonPoints}
                    stroke="black"
                    strokeWidth="1.5"
                  />
                  {mapPoints.map((point, i) => {
                    const { x, y } = toXY(point.value, i);
                    return (
                      <circle
                        key={point.label}
                        cx={x}
                        cy={y}
                        r="2"
                        fill={i === 0 ? 'red' : 'black'}
                      />
                    );
                  })}
                </svg>
                {/* Labels positioned around the chart */}
                {mapPoints.map((point, i) => {
                  const angle = angleStep * i - Math.PI / 2;
                  // Push labels further out than the chart
                  const lx = 50 + 48 * Math.cos(angle);
                  const ly = 50 + 48 * Math.sin(angle);
                  return (
                    <span
                      key={point.label}
                      className="absolute text-[9px] font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ left: `${lx}%`, top: `${ly}%` }}
                    >
                      {point.label}
                    </span>
                  );
                })}
              </div>
              <p className="text-center text-[10px] uppercase mt-2 font-bold tracking-widest">
                Dialect_Map
              </p>
            </div>
          </div>

          {/* Section 03 — Idiom Decoder */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="p-4 border-b border-ink bg-ink">
              <h3 className="font-display text-lg font-bold uppercase">03 // Idiom Decoder</h3>
            </div>
            <div className="grow overflow-hidden">
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
                  {reportData.idioms.map((idiom) => (
                    <tr key={idiom.term} className="bg-paper hover:bg-paper-dim/50">
                      <td className="px-4 py-3 border-r border-ink font-bold align-top">
                        {idiom.term}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs align-top">{idiom.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-ink bg-paper p-4 flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-wider gap-4">
          <div className="flex items-center gap-2">
            <ScrollIcon className="h-4 w-4" aria-hidden="true" />
            <span>Archived by {"Fulano d'Town"}</span>
          </div>
          <div className="h-px w-full md:w-32 bg-ink/20"></div>
          <div className="flex items-center gap-4">
            <span>{reportData.id}</span>
            <span className="px-2 py-0.5 font-bold">{'2026-08-13-13:00:00'}</span>
          </div>
        </div>

        {/* Color bar */}
        <div className="h-2 w-full flex">
          <div className="h-full w-1/4 bg-black"></div>
          <div className="h-full w-1/4 bg-gray-500"></div>
          <div className="h-full w-1/4 bg-gray-300"></div>
          <div className="h-full w-1/4 bg-paper-dim"></div>
        </div>
      </div>

      <div className="mb-12 text-center print:hidden">
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
