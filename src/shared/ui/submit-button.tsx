"use client";

import { useFormStatus } from "react-dom";
import { buttonClassName } from "@/shared/ui/button";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

/**
 * Bouton de soumission avec etat de chargement visible pendant
 * l'execution de la Server Action — sans ca, un clic ne donne aucun
 * retour tant que l'action tourne (ex: verification SMTP, generation
 * de variantes), ce qui invite au double-clic.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={buttonClassName(variant, size, className)}>
      {pending && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
