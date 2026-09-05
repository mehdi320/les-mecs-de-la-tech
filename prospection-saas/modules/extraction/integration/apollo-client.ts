import type { ExtractionQueryParams } from "../domain/extraction-batch";

/**
 * Client pour l'API Apollo.io (docs.apollo.io). Endpoint et forme de réponse
 * établis à partir de la documentation publique consultée le 2026-09-05 — à
 * revalider contre la doc live avant le premier appel réel, ces contrats
 * changent sans préavis. Utilise `api_search` plutôt que `search` : ce dernier
 * renvoie 403 sur les plans de base.
 */
const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

export interface ApolloPersonResult {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  organization: {
    name: string;
    website_url: string | null;
    primary_domain: string | null;
    industry: string | null;
    estimated_num_employees: number | null;
  } | null;
}

export interface ApolloSearchResponse {
  people: ApolloPersonResult[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
  };
}

export class ApolloClientError extends Error {}

export async function searchPeople(params: ExtractionQueryParams): Promise<ApolloSearchResponse> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new ApolloClientError(
      "APOLLO_API_KEY manquant. Renseigner la variable d'environnement avant de lancer une extraction réelle.",
    );
  }

  const response = await fetch(`${APOLLO_API_BASE}/mixed_people/api_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      q_organization_domains: params.organizationDomains,
      person_titles: params.personTitles,
      person_locations: params.personLocations,
      per_page: params.perPage ?? 25,
    }),
  });

  if (!response.ok) {
    throw new ApolloClientError(`Apollo API a répondu ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as ApolloSearchResponse;
}
