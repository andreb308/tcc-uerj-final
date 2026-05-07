import { TerminalCard } from '@/components/intake/terminal-card';
import { IntakeForm } from '@/components/intake/intake-form';
import { toast } from 'sonner';
import { BackgroundOverlay } from '@/components/intake/background-overlay';

export default function Page() {
  return (
    <>
      <BackgroundOverlay />
      <TerminalCard
        className="motion-opacity-in-0 motion-duration-500 motion-delay-500 motion-ease-spring-bouncy motion-preset-slide-up-sm relative z-10"
        title="/// INTAKE_PROTOCOL_INIT ///"
      >
        <IntakeForm />
      </TerminalCard>
    </>
  );
}
