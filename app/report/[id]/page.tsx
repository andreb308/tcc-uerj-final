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
import { useSuspenseQuery } from '@tanstack/react-query';

import type { ReportRecord } from '@/lib/schemas/report';
import { Modal, ModalBody, ModalContent, ModalTrigger } from '@/components/ui/animated-modal';
import { useAuth } from '@clerk/nextjs';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, userId: clientUserId } = useAuth();
  // const { messages, sendMessage } = useChat();

  const { data: report } = useSuspenseQuery<ReportRecord>({
    queryKey: ['report', id],
    queryFn: async () => {
      const res = await fetch(`/api/report/${id}`);
      if (!res.ok) {
        throw new Error((await res.json()).error);
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  if (!report || !report.reportData) {
    throw new Error('Report analysis data is incomplete or missing.');
  }

  const reportData = report.reportData;

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

  const maxPolygonPoints = mapPoints
    .map((_, i) => {
      const { x, y } = toXY(100, i);
      return `${x},${y}`;
    })
    .join(' ');

  const getPointsAtPercent = (percent: number) => {
    return mapPoints
      .map((_, i) => {
        const { x, y } = toXY(percent, i);
        return `${x},${y}`;
      })
      .join(' ');
  };

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
            <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
              <Modal>
                <ModalTrigger className="p-1 border border-ink rounded-none bg-white text-left block overflow-visible cursor-pointer transition-all duration-150 hover:shadow-[4px_4px_0px_0px_black] shrink-0">
                  <img
                    alt="Album Cover"
                    className="size-32 md:size-48 object-cover pointer-events-none"
                    src={
                      report.albumCover?.medium ||
                      report.albumCover?.big ||
                      report.albumCover?.small ||
                      'https://placehold.co/600x600?text=Album+Cover'
                    }
                  />
                </ModalTrigger>
                <ModalBody className="bg-white border-2 border-ink p-2 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center">
                  <ModalContent className="p-2 flex items-center justify-center w-full h-full grow overflow-hidden">
                    <img
                      alt="Album Cover Fullscreen"
                      className="max-w-full max-h-full object-contain border border-ink"
                      src={
                        report.albumCover?.xl ||
                        report.albumCover?.big ||
                        report.albumCover?.medium ||
                        'https://placehold.co/1024x1024?text=Album+Cover'
                      }
                    />
                  </ModalContent>
                </ModalBody>
              </Modal>
              <div className="flex-grow">
                <h1 className="font-display text-5xl md:text-7xl font-bold uppercase leading-[0.9] tracking-tighter">
                  {report.trackTitle} // <br />
                  {report.artist}
                </h1>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 pt-4 border-t border-ink/20">
              <div className="flex flex-wrap gap-y-2 gap-x-8 font-mono text-xs md:text-sm">
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
                  <span className="text-muted-foreground">KEY:</span>{' '}
                  {reportData.metadata.musicalKey}
                </div>
              </div>
              {isLoaded && clientUserId && (
                <Link
                  href={`/chat/${id}`}
                  className="print:hidden group inline-flex shrink-0 items-center gap-3 border-2 border-foreground bg-primary px-6 py-3 font-display text-xs font-bold uppercase tracking-[2px] text-primary-foreground transition-all duration-150 hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_black]"
                >
                  <ChatCircleDotsIcon
                    className="size-4 transition-transform duration-150 group-hover:scale-110"
                    weight="bold"
                    aria-hidden="true"
                  />
                  {report.chatHistory ? 'Continue' : 'Start'} Conversation
                  <ArrowRightIcon
                    className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                    weight="bold"
                    aria-hidden="true"
                  />
                </Link>
              )}
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
                <span className="text-foreground px-1 font-bold mr-1">SUMMARY:</span>
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
                  {/* Faded background polygon representing absolute maximum bounds (100) */}
                  <polygon
                    fill="rgba(0,0,0,0.02)"
                    points={maxPolygonPoints}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  {/* Concentric Grid polygons at 25%, 50%, 75% */}
                  {[25, 50, 75].map((percent) => (
                    <polygon
                      key={percent}
                      fill="none"
                      points={getPointsAtPercent(percent)}
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="0.75"
                      strokeDasharray="1,3"
                    />
                  ))}
                  {/* Axis Grid Lines from Center to outer maximum bounds */}
                  {mapPoints.map((_, i) => {
                    const { x, y } = toXY(100, i);
                    return (
                      <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2={x}
                        y2={y}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="1"
                        strokeDasharray="1,2"
                      />
                    );
                  })}
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
            <div className="p-4 border-b border-ink">
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
          href="/"
          className="mt-8 bg-primary text-primary-foreground px-4 py-2 inline-flex items-center gap-2 text-sm font-mono hover:underline hover:text-alert transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          RETURN TO HOMEPAGE
        </Link>
      </div>
    </main>
  );
}
