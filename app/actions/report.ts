'use server';

import { prisma } from '@/lib/prisma';
import {
  type ReportRecord,
  reportRecordSchema,
  TargetLanguage,
  intakeFormSchema,
} from '@/lib/schemas/report';
import { ReportStatus } from '@/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Form data accepted by createReportAction
// ---------------------------------------------------------------------------
export interface CreateReportInput {
  artist: string;
  trackTitle: string;
  targetLanguage: TargetLanguage;
  artifactData: string;
}

/**
 * Creates a new report record with status `pending`.
 * Returns the generated `{ id }`.
 */
export async function createReportAction(input: CreateReportInput): Promise<{ id: string }> {
  // Validate input data using the shared schema to prevent HTML manipulation bypass
  const validated = intakeFormSchema.parse(input);

  const report = await prisma.report.create({
    data: {
      status: 'pending',
      artist: validated.artist,
      trackTitle: validated.trackTitle,
      targetLanguage: validated.targetLanguage,
      artifactData: validated.artifactData,
    },
  });

  return { id: report.id };
}

/**
 * Retrieves a report record by ID, or `null` if not found.
 */
export async function getReportAction(id: string): Promise<ReportRecord | null> {
  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) return null;

  // We parse it through our unified zod schema to ensure the type matches perfectly.
  // The Prisma json field needs to be parsed or safely assumed to match ReportData schema.
  return reportRecordSchema.parse(report);
}

/**
 * Merges partial data into an existing record.
 * Commonly used to persist the final AI output after streaming completes.
 */
export async function updateReportAction(
  id: string,
  partial: Partial<Pick<ReportRecord, 'reportData' | 'artist' | 'trackTitle'>>
): Promise<ReportRecord | null> {
  // Prisma requires we explicitly type json payloads.
  // In our schema, reportData is an object that matches ReportData, which Prisma accepts as JsonValue.
  const dataToUpdate: any = { ...partial };

  try {
    const updated = await prisma.report.update({
      where: { id },
      data: dataToUpdate,
    });

    return reportRecordSchema.parse(updated);
  } catch (err) {
    // Return null if record not found or other update issue
    return null;
  }
}

/**
 * Updates the status field of an existing record.
 */
export async function setReportStatusAction(
  id: string,
  status: ReportStatus
): Promise<ReportRecord | null> {
  try {
    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });

    return reportRecordSchema.parse(updated);
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves all report records.
 */
export async function getAllReportsAction(): Promise<ReportRecord[]> {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return reports.map((r) => reportRecordSchema.parse(r));
  } catch (err) {
    console.error('Error getting all reports:', err);
    return [];
  }
}

/**
 * Persists the chat messages array (UIMessage[]) as JSON on the report record.
 */
export async function saveChatHistoryAction(
  reportId: string,
  chatHistory: unknown
): Promise<{ success: boolean }> {
  try {
    await prisma.report.update({
      where: { id: reportId },
      data: { chatHistory: chatHistory as any },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
