"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CampaignIcon,
  GlobeIcon,
  HomeIcon,
  ListImportIcon,
  MailboxIcon,
  SequenceIcon,
  ShieldCheckIcon,
} from "@/shared/ui/icons";

const LIENS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/mailboxes", label: "Mailboxes", icon: MailboxIcon },
  { href: "/domaines", label: "Domaines", icon: GlobeIcon },
  { href: "/sequences", label: "Sequences", icon: SequenceIcon },
  { href: "/listes", label: "Listes", icon: ListImportIcon },
  { href: "/campagnes", label: "Campagnes", icon: CampaignIcon },
  { href: "/conformite", label: "Conformite", icon: ShieldCheckIcon },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {LIENS.map((lien) => {
        const actif = lien.href === "/" ? pathname === "/" : pathname.startsWith(lien.href);
        const Icon = lien.icon;
        return (
          <li key={lien.href}>
            <Link
              href={lien.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                actif ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${actif ? "text-brand-600" : "text-slate-400"}`} />
              {lien.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
