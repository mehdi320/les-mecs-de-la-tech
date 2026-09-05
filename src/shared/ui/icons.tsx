// Icones ligne, dessinees a la main (pas de dependance a une librairie
// d'icones) : viewBox 24x24, stroke uniforme, meme esprit que le reste
// du kit UI.
import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5h2.5a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

export function MailboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 8l9 6 9-6" />
    </Icon>
  );
}

export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.4-3.6-8.5S9.6 5.9 12 3.5Z" />
    </Icon>
  );
}

export function SequenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6h11M4 12h7M4 18h11" />
      <circle cx="19" cy="6" r="1.6" />
      <circle cx="14" cy="18" r="1.6" />
    </Icon>
  );
}

export function ListImportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v11" />
      <path d="M7.5 10 12 14.5 16.5 10" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </Icon>
  );
}

export function CampaignIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 10.5v3a1 1 0 0 0 1 1h2l8.5 4V5.5L6 9.5H4a1 1 0 0 0-1 1Z" />
      <path d="M17.5 9.2a4 4 0 0 1 0 5.6" />
      <path d="M20 7a7 7 0 0 1 0 10" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 5 6.3v5.4c0 4.4 3 7.4 7 8.8 4-1.4 7-4.4 7-8.8V6.3L12 3.5Z" />
      <path d="M9 12.2l2.1 2.1 4-4.2" />
    </Icon>
  );
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4 21.5 20h-19L12 4Z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}
