import { AppSidebar } from '@/components/intake/app-sidebar';
import { Header } from '@/components/intake/header';
import { StatusBar } from '@/components/intake/status-bar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />

      <SidebarProvider className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />

        <div className="flex min-h-0 flex-1 flex-col">
          <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-6">
            {children}
          </main>
        </div>
      </SidebarProvider>

      <StatusBar />
    </div>
  );
}
