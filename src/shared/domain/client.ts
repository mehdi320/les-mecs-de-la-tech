export interface Client {
  id: string;
  nom: string;
  planId: string;
  dpaSignedAt: string | null;
  dpaVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRepository {
  findById(id: string): Client | null;
  create(input: { id: string; nom: string; planId: string }): Client;
  signDpa(id: string, dpaVersion: string): Client;
}

/**
 * Un client ne peut activer aucune campagne tant que son DPA n'est
 * pas signe (cf. SPEC.md section 4, etape 1).
 */
export function peutEnvoyer(client: Client): boolean {
  return client.dpaSignedAt !== null;
}
