import { NextResponse } from 'next/server';
import { streamText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { reportDataSchema } from '@/lib/schemas/report';
import { getReport, updateReport, setReportStatus } from '@/lib/report-store';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';

// Allow streaming responses up to 60 seconds (report generation is heavier than chat)
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET /api/report/[id] — Stream or retrieve a report
// ---------------------------------------------------------------------------
// 1. Looks up the record by ID
// 2. If complete → returns cached reportData as JSON (no re-generation)
// 3. If pending → sets status to 'generating', streams structured output via
//    AI SDK v6 `streamText` + `Output.object()` (replaces deprecated streamObject)
// 4. On finish → persists the final object and sets status to 'complete'
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = getReport(id);

  if (!record) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Already generated — return cached data without re-calling the LLM
  if (record.status === 'complete' && record.reportData) {
    return NextResponse.json(record.reportData);
  }

  // Prevent concurrent generation for the same report
  if (record.status === 'generating') {
    return NextResponse.json(
      { error: 'Report is currently being generated' },
      { status: 409 },
    );
  }

  // Transition to generating state
  setReportStatus(id, 'generating');

  const result = streamText({
    model: google('gemma-4-31b-it'),
    system: REPORT_SYSTEM_PROMPT,
    prompt: [
      `Artist: ${record.artist}`,
      `Track: ${record.trackTitle}`,
      `Target Language: ${record.targetLanguage}`,
      '',
      'Lyrics:',
      record.artifactData,
    ].join('\n'),
    output: Output.object({ schema: reportDataSchema }),
    onFinish: async () => {
      try {
        // Await the fully parsed output from the stream
        const finalOutput = await result.output;

        if (finalOutput) {
          updateReport(id, { reportData: finalOutput });
          setReportStatus(id, 'complete');
        } else {
          setReportStatus(id, 'error');
        }
      } catch {
        setReportStatus(id, 'error');
      }
    },
    onError: () => {
      setReportStatus(id, 'error');
    },
  });

  return result.toTextStreamResponse();
}
