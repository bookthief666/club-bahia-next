import { ConceptNav } from '@/components/concepts/ConceptNav';

export function ConceptShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <ConceptNav />
      <main className={`min-h-screen overflow-x-hidden ${className}`}>{children}</main>
    </>
  );
}
