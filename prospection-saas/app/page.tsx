import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Prospection SaaS — MVP</h1>
      <p className="text-sm text-neutral-600">
        Extraction, vérification et conformité. Délivrabilité et boucle de performance sont en V2
        (voir DECISIONS-BLOQUANTES.md).
      </p>
      <nav className="flex gap-4 text-sm font-medium text-blue-700">
        <Link href="/extraction">Extraction</Link>
        <Link href="/verification">Vérification</Link>
        <Link href="/conformite">Conformité</Link>
      </nav>
    </main>
  );
}
