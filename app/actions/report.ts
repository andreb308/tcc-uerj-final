'use server';

import { prisma } from '@/lib/prisma';
import {
  type ReportRecord,
  reportRecordSchema,
  TargetLanguage,
  intakeFormSchema,
  type AlbumCover,
} from '@/lib/schemas/report';
import { ReportStatus } from '@/generated/prisma/enums';
import { auth } from '@clerk/nextjs/server';

// ---------------------------------------------------------------------------
// Form data accepted by createReportAction
// ---------------------------------------------------------------------------
export interface CreateReportInput {
  artist: string;
  trackTitle: string;
  targetLanguage: TargetLanguage;
  artifactData: string;
  albumCover?: AlbumCover;
}

/**
 * Creates a new report record with status `pending`.
 * Returns the generated `{ id }`.
 */
export async function createReportAction(input: CreateReportInput): Promise<{ id: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized: User must be logged in to create a report');
  }

  // Validate input data using the shared schema to prevent HTML manipulation bypass
  const validated = intakeFormSchema.parse(input);

  const report = await prisma.report.create({
    data: {
      userId,
      status: 'pending',
      artist: validated.artist,
      trackTitle: validated.trackTitle,
      targetLanguage: validated.targetLanguage,
      artifactData: validated.artifactData,
      albumCover: validated.albumCover || undefined,
    },
  });

  return { id: report.id };
}

/**
 * Retrieves a report record by ID, or `null` if not found.
 */
export async function getReportAction(id: string): Promise<ReportRecord | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report || report.userId !== userId) return null;

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
  const { userId } = await auth();
  if (!userId) return null;

  // Prisma requires we explicitly type json payloads.
  // In our schema, reportData is an object that matches ReportData, which Prisma accepts as JsonValue.
  const dataToUpdate: any = { ...partial };

  try {
    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return null;
    }

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
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return null;
    }

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
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const reports = await prisma.report.findMany({
      where: { userId },
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
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const existing = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existing || existing.userId !== userId) {
      return { success: false };
    }

    await prisma.report.update({
      where: { id: reportId },
      data: { chatHistory: chatHistory as any },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Retrieves a report record by ID for public viewing.
 * Omit chat history to prevent leak.
 */
export async function getPublicReportAction(id: string): Promise<ReportRecord | null> {
  try {
    const { userId } = await auth();
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) return null;

    // Zero out chat history for public view if not logged in
    if (!userId) {
      const publicReport = {
        ...report,
        chatHistory: null,
      };
      return reportRecordSchema.parse(publicReport);
    }

    return reportRecordSchema.parse(report);
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves a report record by ID for the authorized owner to chat.
 * Includes chat history.
 */
export async function getChatSessionAction(id: string): Promise<ReportRecord | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error(
      'Unauthorized: This record does not belong to your active session credentials or the record is missing.'
    );
  }

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report || report.userId !== userId) {
    throw new Error('Unauthorized: You do not have access to this chat session');
  }

  return reportRecordSchema.parse(report);
}
