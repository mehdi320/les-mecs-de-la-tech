# app/api/tracking

Pixel de suivi d'ouverture (`pixel/[eventId]/route.ts`) — cf.
SPEC.md section 9.7 et `src/modules/delivrabilite/domain/tracking-pixel.ts`.
Route uniquement : marque l'evenement d'envoi ouvert
(`EnvoiEvenementRepository.marquerOuvert`) puis renvoie un GIF
transparent 1x1, quoi qu'il arrive (un pixel ne doit jamais faire
echouer l'affichage de l'email chez le destinataire).
