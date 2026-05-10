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
  id: z.string(),
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

// ---------------------------------------------------------------------------
// Full envelope schema
// ---------------------------------------------------------------------------

export const reportRecordSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'generating', 'complete', 'error']),
  artist: z.string(),
  trackTitle: z.string(),
  targetLanguage: z.string(),
  artifactData: z.string(),
  reportData: reportDataSchema.nullable(),
  createdAt: z.date(),
});

export type ReportRecord = z.infer<typeof reportRecordSchema>;
