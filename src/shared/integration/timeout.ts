/**
 * Les resolutions DNS (dns/promises) ne portent pas de timeout
 * integre : sur un reseau qui bloque silencieusement le trafic
 * sortant plutot que de le rejeter, une promesse DNS peut ne jamais
 * se resoudre et bloquer la requete (ex: verification de domaine,
 * MX). Toute resolution DNS du produit doit passer par cet helper.
 */
export async function avecDelai<T>(promesse: Promise<T>, delaiMs: number, valeurParDefaut: T): Promise<T> {
  let expire = false;
  const timer = new Promise<T>((resolve) => {
    setTimeout(() => {
      expire = true;
      resolve(valeurParDefaut);
    }, delaiMs);
  });
  const resultat = await Promise.race([promesse, timer]);
  if (expire) return valeurParDefaut;
  return resultat;
}
