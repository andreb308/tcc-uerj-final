'use client';

import { TerminalCard } from '@/components/intake/terminal-card';
import { IntakeForm } from '@/components/intake/intake-form';
import { toast } from 'sonner';

export default function Page() {
  return (
    <TerminalCard title="/// INTAKE_PROTOCOL_INIT ///">
      <button
        type="button"
        onClick={() => toast('Teste')}
        className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Teste Toast
      </button>
      <IntakeForm />
    </TerminalCard>
  );
}
