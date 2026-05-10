import type { ReportData } from '@/lib/schemas/report';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Report Record — the full envelope wrapping AI output + form input
// ---------------------------------------------------------------------------

export type ReportStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface ReportRecord {
  id: string;
  status: ReportStatus;

  // Form input (from IntakeForm)
  artist: string;
  trackTitle: string;
  targetLanguage: string;
  artifactData: string; // lyrics

  // AI-generated output (filled progressively during streaming)
  reportData: ReportData | null;

  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Form data accepted by createReport
// ---------------------------------------------------------------------------

export interface CreateReportInput {
  artist: string;
  trackTitle: string;
  targetLanguage: string;
  artifactData: string;
}

// ---------------------------------------------------------------------------
// In-memory store — module-level Map, replaced by Prisma later
// ---------------------------------------------------------------------------
// When Prisma arrives, swap the Map operations for:
//   prisma.report.create()  / prisma.report.findUnique()  / prisma.report.update()
// The public interface (createReport, getReport, updateReport, setReportStatus)
// stays identical so callers never need to change.
// ---------------------------------------------------------------------------

let store: ReportRecord[] = [];

// ---------------------------------------------------------------------------
// Load initial data from dump if exists
// ---------------------------------------------------------------------------
try {
  const dumpPath = path.join(process.cwd(), 'report-dump.json');
  if (fs.existsSync(dumpPath)) {
    const rawData = fs.readFileSync(dumpPath, 'utf-8');
    const parsedData = JSON.parse(rawData);
    if (Array.isArray(parsedData)) {
      store = parsedData.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
      console.log(`[Store] Loaded ${store.length} reports from report-dump.json`);
    }
  }
} catch (err) {
  console.error('[Store] Failed to load report dump:', err);
}

/**
 * Creates a new report record with status `pending`.
 * Returns the generated `{ id }`.
 */
export function createReport(input: CreateReportInput): { id: string } {
  const id = String(store.length + 1);

  const record: ReportRecord = {
    id,
    status: 'pending',
    artist: input.artist,
    trackTitle: input.trackTitle,
    targetLanguage: input.targetLanguage,
    artifactData: input.artifactData,
    reportData: null,
    createdAt: new Date(),
  };

  store = [...store, record];
  console.log('Report created.\n' + JSON.stringify(store));

  return { id };
}

/**
 * Retrieves a report record by ID, or `null` if not found.
 */
export function getReport(id: string): ReportRecord | null {
  const searchResult = store.find((r) => {
    console.log(`Buscand report ${id}. Comparando com ${r.id}`);
    return r.id === id;
  });
  console.log('getReport -> ' + JSON.stringify(searchResult));
  return searchResult ?? null;
}

/**
 * Merges partial data into an existing record.
 * Commonly used to persist the final AI output after streaming completes.
 */
export function updateReport(
  id: string,
  partial: Partial<Pick<ReportRecord, 'reportData' | 'artist' | 'trackTitle'>>
): ReportRecord | null {
  const record = store.find((r) => r.id === id);
  if (!record) return null;

  const updated: ReportRecord = { ...record, ...partial };
  store = store.map((rep) => (rep.id === id ? updated : rep));
  console.log('updateReport -> ' + JSON.stringify(store));

  return updated;
}

/**
 * Updates the status field of an existing record.
 */
export function setReportStatus(id: string, status: ReportStatus): ReportRecord | null {
  const record = store.find((r) => r.id === id);
  if (!record) return null;

  const updated: ReportRecord = { ...record, status };
  store = store.map((rep) => (rep.id === id ? updated : rep));
  console.log('setReportStatus -> ' + JSON.stringify(store));
  return updated;
}

/**
 * Retrieves all report records.
 */
export function getAllReports() {
  return store;
}
