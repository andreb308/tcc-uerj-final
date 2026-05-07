import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const dialectMapEntrySchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
});

export const idiomSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

// ---------------------------------------------------------------------------
// AI-generated report output schema
// ---------------------------------------------------------------------------
// This schema describes the structured data that the LLM generates.
// Fields that come from form input (reportId, trackTitle, artist, footer)
// are intentionally excluded — they live in the ReportRecord envelope.
// ---------------------------------------------------------------------------

export const reportDataSchema = z.object({
  metadata: z.object({
    album: z.string(),
    year: z.number(),
    genre: z.string(),
    bpm: z.number(),
    musicalKey: z.string(),
  }),

  thesis: z.object({
    summary: z.string(),
    extendedAnalysis: z.string(),
    instructorNote: z.string(),
  }),

  dataMetrics: z.object({
    wordCount: z.number(),
    uniqueStems: z.number(),
    complexity: z.number().min(0).max(1),
    complexityLabel: z.string(),
    rhymeDensity: z.number().min(1).max(5),
    dialectMap: z.array(dialectMapEntrySchema),
  }),

  idioms: z.array(idiomSchema),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript type — use this everywhere instead of manual interfaces
// ---------------------------------------------------------------------------

export type ReportData = z.infer<typeof reportDataSchema>;
export type DialectMapEntry = z.infer<typeof dialectMapEntrySchema>;
export type Idiom = z.infer<typeof idiomSchema>;
