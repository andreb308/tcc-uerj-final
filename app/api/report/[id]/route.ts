import { NextResponse } from 'next/server';
import { getReportAction, updateReportAction, setReportStatusAction } from '@/app/actions/report';
import { generateText, Output } from 'ai';
import {
  google,
  GoogleGenerativeAIProviderMetadata,
  GoogleLanguageModelOptions,
} from '@ai-sdk/google';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';
import { reportDataSchema } from '@/lib/schemas/report';
import { ReportStatus } from '@/generated/prisma/enums';

export const maxDuration = 30; // Set to 30 seconds
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

    const report = await getReportAction(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report?.reportData) {
      await setReportStatusAction(id, 'generating');
      const { text, output, sources, providerMetadata } = await generateText({
        model: google('gemini-3.1-flash-lite'),
        prompt: `
        artist: '${report.artist}',
        trackTitle: '${report.trackTitle}',
        targetLanguage: '${report.targetLanguage}',
        artifactData: ${JSON.stringify(report.artifactData)},`,
        tools: {
          google_search: google.tools.googleSearch({}),
          url_context: google.tools.urlContext({}),
        },
        system: REPORT_SYSTEM_PROMPT,
        output: Output.object({ schema: reportDataSchema }),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: 'medium',
              includeThoughts: true,
            },
          } satisfies GoogleLanguageModelOptions,
        },
      });

      // console.log();

      // access the grounding metadata. Casting to the provider metadata type
      // is optional but provides autocomplete and type safety.
      const metadata = providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
      const groundingMetadata = metadata?.groundingMetadata;
      const safetyRatings = metadata?.safetyRatings;

      console.log(JSON.stringify({ text, sources, groundingMetadata, safetyRatings }));
      // console.log(JSON.stringify(response.messages));

      // Save the generated data and update status
      await updateReportAction(id, { reportData: output });
      await setReportStatusAction(id, 'complete');

      // Return the updated report record
      const updatedReport = await getReportAction(id);
      return NextResponse.json(updatedReport);
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', JSON.stringify(error));
    return NextResponse.json({ error: 'Internal server error', ...error }, { status: 500 });
  }
}
