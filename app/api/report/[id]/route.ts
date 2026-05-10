import { NextResponse } from 'next/server';
import { getReport, updateReport, setReportStatus } from '@/lib/report-store';
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';
import { reportDataSchema } from '@/lib/schemas/report';

export const maxDuration = 300; // Set to 300 seconds
// ---------------------------------------------------------------------------
// GET /api/report/[id] — Retrieve a report record
// ---------------------------------------------------------------------------
// Returns the full report record (status, input data, and AI output if available)
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`report/[id]/route.ts -> ID recebido: ${id}`);

    if (!id) {
      return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
    }

    const report = getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report?.reportData) {
      setReportStatus(id, 'generating');
      const { output } = await generateText({
        model: google('gemini-3.1-flash-lite'),
        prompt: `
        artist: '${report.artist}',
        trackTitle: '${report.trackTitle}',
        targetLanguage: '${report.targetLanguage}',
        artifactData: ${JSON.stringify(report.artifactData)},`,
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        system: REPORT_SYSTEM_PROMPT,
        output: Output.object({ schema: reportDataSchema }),
      });

      // Save the generated data and update status
      updateReport(id, { reportData: output });
      setReportStatus(id, 'complete');

      // Return the updated report record
      const updatedReport = getReport(id);
      return NextResponse.json(updatedReport);
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', JSON.stringify(error));
    return NextResponse.json({ error: 'Internal server error', ...error }, { status: 500 });
  }
}
