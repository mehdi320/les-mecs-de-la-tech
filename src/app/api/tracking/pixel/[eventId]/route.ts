import { NextResponse } from "next/server";
import { getContainer } from "@/shared/integration/container";

// GIF transparent 1x1, le plus petit format universellement supporte
// par les clients mail. Jamais mis en cache : chaque requete doit
// atteindre le serveur pour marquer l'ouverture.
const PIXEL_TRANSPARENT = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { eventId: string } }) {
  try {
    const { envoi } = getContainer();
    envoi.envoiEvenements.marquerOuvert(params.eventId);
  } catch {
    // Un pixel ne doit jamais faire echouer l'affichage de l'email chez
    // le destinataire : toute erreur cote suivi est silencieuse ici.
  }

  return new NextResponse(PIXEL_TRANSPARENT, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_TRANSPARENT.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}
