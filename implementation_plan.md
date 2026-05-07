# Streaming Report Generation Pipeline

Form submission → server-side report creation → progressive AI streaming → optional chat conversion.

## Data Flow

```
┌─────────────┐    POST /api/report     ┌──────────────────┐
│  IntakeForm  │ ──────────────────────► │  Create record   │
│  (validated) │    { artist, track,     │  status: pending │
│              │      lyrics, lang }     │  returns { id }  │
└──────┬───────┘                         └──────────────────┘
       │
       │  router.push(`/report/${id}`)
       ▼
┌──────────────┐                        ┌──────────────────┐
│  Report Page │   GET /api/report/[id] │  streamObject()  │
│  /report/[id]│ ──────────────────────►│  zod ReportData  │
│              │   GET /api/report/[id] │                  │
│              │◄─── partial object ─── │  schema          │
│  useObject() │    streamed back       └──────────────────┘
└──────┬───────┘
       │
       │  "Start Conversation" click
       ▼
┌──────────────┐   POST /api/chat       ┌──────────────────┐
│  Chat Mode   │ ──────────────────────►│  streamText()    │
│  useChat()   │◄─── text streamed ─── │  seeded w/ report│
└──────────────┘                        └──────────────────┘
```

---

## Section 1: Shared Zod Schema

> [!IMPORTANT]
> The `ReportData` type currently lives as a TypeScript interface in `app/report/report-data.ts`. It needs to become a **zod schema** so it can be used both for `streamObject` validation on the server and for type inference on the client.

#### [NEW] `lib/schemas/report.ts`

Define a single zod schema that replaces the current `ReportData` interface:

```typescript
import { z } from 'zod';

export const dialectMapEntrySchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
});

export const idiomSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

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

export type ReportData = z.infer<typeof reportDataSchema>;
```

- The `reportId`, `trackTitle`, `artist`, and `footer` fields are **not** part of the AI-generated schema — they come from the form input and server-side record creation
- This schema is what `streamObject` will use to validate and stream the AI output
- The existing `report-data.ts` versioned datasets can import this type and remain as demo/seed data

---

## Section 2: In-Memory Report Store (Prisma-Ready)

> [!NOTE]
> This is a thin abstraction layer that will be swapped for Prisma when the database is set up. The interface remains the same.

#### [NEW] `lib/report-store.ts`

```typescript
interface ReportRecord {
  id: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  // Form input (from IntakeForm)
  artist: string;
  trackTitle: string;
  targetLanguage: string;
  artifactData: string; // lyrics
  // AI-generated output (filled progressively)
  reportData: ReportData | null;
  createdAt: Date;
}
```

Exposed functions:

| Function | Description |
|---|---|
| `createReport(formData)` | Creates a new record with `status: 'pending'`, returns `{ id }` |
| `getReport(id)` | Returns the full `ReportRecord` or `null` |
| `updateReport(id, partial)` | Merges partial data into the record (used during streaming) |
| `setReportStatus(id, status)` | Updates the status field |

Implementation: a module-level `Map<string, ReportRecord>` with `crypto.randomUUID()` for ID generation.

When Prisma arrives, this file becomes a thin wrapper around `prisma.report.create()` / `prisma.report.findUnique()` / `prisma.report.update()`.

---

## Section 3: API Routes

### 3a. `POST /api/report` — Create Report Record

#### [NEW] `app/api/report/route.ts`

- Receives the validated form data (`artist`, `trackTitle`, `targetLanguage`, `artifactData`)
- Calls `createReport(formData)` from the store
- Returns `{ id: string }` as JSON
- No AI call happens here — just record creation

### 3b. `GET /api/report/[id]` — Stream or Retrieve Report

#### [NEW] `app/api/report/[id]/route.ts`

- Looks up the report record by `id` via `getReport(id)`
- If not found → 404
- If already `complete` → return the cached `reportData` as JSON
- Sets status to `generating`
- Calls `streamObject()` from the AI SDK with:
  - `model: google('gemma-4-31b-it')`
  - `schema: reportDataSchema` (the zod schema from Section 1)
  - `system: <existing system prompt>` (moved from current `/api/chat/route.ts`)
  - `prompt: <form data serialized>` (artist, track, lyrics)
- Uses `result.toTextStreamResponse()` to stream the partial object back
- On completion, calls `updateReport(id, finalData)` and `setReportStatus(id, 'complete')`

### 3c. `POST /api/chat` — Chat Conversation (existing, modified)

#### [MODIFY] `app/api/chat/route.ts`

- Add an optional `reportId` field to the request body
- If `reportId` is provided, look up the report and inject its `reportData` into the system prompt as context
- Keep using `streamText` and `useChat` as-is
- System prompt gains a preamble like: _"The following is the analysis report for context: {JSON}"_

---

## Section 4: Client — Form Submission

#### [MODIFY] `components/intake/intake-form.tsx`

Update the `onValid` handler:

```typescript
const onValid = async (data: IntakeFormData) => {
  // 1. Create report record on the server
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    toast.error('Failed to create report');
    return;
  }

  const { id } = await res.json();

  // 2. Navigate to the report page
  toast.success('Protocol executed successfully!');
  router.push(`/report/${id}`);
};
```

---

## Section 5: Client — Report Page (Dynamic Route)

#### [NEW] `app/report/[id]/page.tsx`

Replaces the current `app/report/page.tsx`. Uses the AI SDK's `useObject` hook for progressive streaming.

**Lifecycle:**

1. Page loads with the `id` param
2. Calls `useObject({ api: '/api/report/${id}', schema: reportDataSchema })`
3. `useObject` returns `{ object, isLoading, error }` where `object` is a `Partial<ReportData>` that fills in progressively
4. Each section renders as its data becomes available:
   - **Header** renders immediately (from form data, not AI)
   - **Metadata** (album, year, genre, bpm, key) fills in first (small fields)
   - **Thesis** (summary, analysis, note) streams in as text
   - **Data Metrics** (wordCount, stems, complexity, dialectMap) fills in
   - **Idioms** table rows appear one by one
5. A skeleton/loading state is shown for sections that haven't resolved yet

**Progressive rendering strategy:**

```tsx
// Each section checks if its data exists before rendering
{report?.metadata ? (
  <MetadataSection data={report.metadata} />
) : (
  <MetadataSkeleton />
)}
```

#### [MODIFY] `app/report/layout.tsx`

- No structural changes needed — it already wraps children

#### [KEEP] `app/report/report-data.ts`

- Keep the versioned demo datasets for development/testing
- They now import `ReportData` from `lib/schemas/report.ts` instead of defining it locally

---

## Section 6: Client — Chat Conversion

When the user clicks "Start Conversation" on a completed report:

#### Behavior in `app/report/[id]/page.tsx`

```typescript
const [chatMode, setChatMode] = useState(false);

// When entering chat mode:
const { messages, input, handleSubmit } = useChat({
  api: '/api/chat',
  body: { reportId: id },
  initialMessages: [{
    role: 'assistant',
    content: `Report analysis complete for "${trackTitle}" by ${artist}. How can I help you explore this further?`,
  }],
});
```

- The report view remains visible (scrollable above the chat)
- A chat input appears at the bottom
- `useChat` is initialized with the `reportId` in the body, so the server injects report context
- The existing `/chat` page route remains separate and unmodified

---

## Section 7: File Structure Summary

```
lib/
├── schemas/
│   └── report.ts              [NEW]  Shared zod schema + ReportData type
└── report-store.ts            [NEW]  In-memory store (Prisma-ready interface)

app/
├── api/
│   ├── report/
│   │   ├── route.ts           [NEW]  POST — create report record
│   │   └── [id]/
│   │       └── route.ts       [NEW]  GET — stream or retrieve report
│   └── chat/
│       └── route.ts           [MODIFY] Accept optional reportId for context
├── report/
│   ├── layout.tsx             [KEEP]  No changes
│   ├── [id]/
│   │   └── page.tsx           [NEW]  Dynamic report page with useObject
│   ├── page.tsx               [DELETE or KEEP as redirect]
│   └── report-data.ts         [MODIFY] Import type from shared schema

components/
└── intake/
    └── intake-form.tsx        [MODIFY] onValid → POST /api/report → navigate
```

---

## Verification Plan

### Automated Tests
- `yarn build` — Ensure no TypeScript errors after all changes
- Manual smoke test via browser:
  1. Fill the intake form with valid data
  2. Submit → observe navigation to `/report/[id]`
  3. Observe progressive section rendering
  4. Click "Start Conversation" → verify chat context includes report

### Manual Verification
- Confirm skeleton states appear before data streams in
- Confirm all report sections render identically to the current hardcoded version once streaming completes
- Confirm refreshing `/report/[id]` for a completed report shows cached data (no re-generation)
- Confirm invalid IDs show a 404 or error state
