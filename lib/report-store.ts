import type { ReportData } from '@/lib/schemas/report';

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

const store = new Map<string, ReportRecord>();

/**
 * Creates a new report record with status `pending`.
 * Returns the generated `{ id }`.
 */
export function createReport(input: CreateReportInput): { id: string } {
  const id = crypto.randomUUID();

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

  store.set(id, record);
  return { id };
}

/**
 * Retrieves a report record by ID, or `null` if not found.
 */
export function getReport(id: string): ReportRecord | null {
  return store.get(id) ?? null;
}

/**
 * Merges partial data into an existing record.
 * Commonly used to persist the final AI output after streaming completes.
 */
export function updateReport(
  id: string,
  partial: Partial<Pick<ReportRecord, 'reportData' | 'artist' | 'trackTitle'>>,
): ReportRecord | null {
  const record = store.get(id);
  if (!record) return null;

  const updated: ReportRecord = { ...record, ...partial };
  store.set(id, updated);
  return updated;
}

/**
 * Updates the status field of an existing record.
 */
export function setReportStatus(id: string, status: ReportStatus): ReportRecord | null {
  const record = store.get(id);
  if (!record) return null;

  const updated: ReportRecord = { ...record, status };
  store.set(id, updated);
  return updated;
}
