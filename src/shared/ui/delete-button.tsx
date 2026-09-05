"use client";

import { useState, useTransition } from "react";

interface DeleteButtonProps {
  /** Renvoie `false` si la suppression a ete bloquee (element encore reference ailleurs). */
  action: (formData: FormData) => Promise<boolean>;
  fields: Record<string, string>;
  confirmMessage: string;
  label?: string;
}

/**
 * Suppression avec confirmation navigateur, sans passer par un
 * <form action> classique : l'action serveur reste appelable
 * directement depuis un composant client (pattern standard des
 * Server Actions Next.js), ce qui permet de lire son retour (bloque
 * ou non) sans construire un systeme de toast complet.
 */
export function DeleteButton({ action, fields, confirmMessage, label = "Supprimer" }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();
  const [bloque, setBloque] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setBloque(false);
          const formData = new FormData();
          for (const [cle, valeur] of Object.entries(fields)) formData.append(cle, valeur);
          startTransition(async () => {
            const ok = await action(formData);
            if (!ok) setBloque(true);
          });
        }}
        className="text-[11px] font-medium text-red-600 hover:underline disabled:opacity-40"
      >
        {pending ? "Suppression…" : label}
      </button>
      {bloque && <p className="mt-1 text-[11px] text-amber-700">Suppression bloquee — encore reference ailleurs.</p>}
    </div>
  );
}
