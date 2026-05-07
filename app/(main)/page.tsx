'use client';

import { TerminalCard } from '@/components/intake/terminal-card';
import { IntakeForm } from '@/components/intake/intake-form';
import { toast } from 'sonner';

export default function Page() {
  return (
    <TerminalCard
      className="motion-opacity-in-0 motion-duration-500 motion-delay-500 motion-ease-spring-bouncy motion-preset-slide-up-sm"
      title="/// INTAKE_PROTOCOL_INIT ///"
    >
      <IntakeForm />
    </TerminalCard>
  );
}
