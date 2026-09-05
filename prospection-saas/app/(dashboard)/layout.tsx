import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <nav className="mb-6 flex gap-4 border-b border-neutral-200 pb-4 text-sm font-medium">
        <Link href="/extraction" className="text-blue-700">Extraction</Link>
        <Link href="/verification" className="text-blue-700">Vérification</Link>
        <Link href="/conformite" className="text-blue-700">Conformité</Link>
      </nav>
      {children}
    </div>
  );
}
