import { getDb } from "@/kernel/db";
import { newCompanyId } from "@/kernel/ids";
import type { Company } from "../domain/company";
import { normalizeDomain } from "../domain/company";

interface CompanyRow {
  id: string;
  domain: string;
  name: string;
  industry: string | null;
  size_range: string | null;
  country: string | null;
  linkedin_url: string | null;
}

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id as Company["id"],
    domain: row.domain,
    name: row.name,
    industry: row.industry,
    sizeRange: row.size_range,
    country: row.country,
    linkedinUrl: row.linkedin_url,
  };
}

export function findCompanyByDomain(domain: string): Company | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM companies WHERE domain = ?")
    .get(normalizeDomain(domain)) as CompanyRow | undefined;
  return row ? toCompany(row) : null;
}

export function upsertCompany(input: Omit<Company, "id">): Company {
  const domain = normalizeDomain(input.domain);
  const existing = findCompanyByDomain(domain);
  if (existing) return existing;

  const db = getDb();
  const company: Company = { ...input, domain, id: newCompanyId() };
  db.prepare(
    `INSERT INTO companies (id, domain, name, industry, size_range, country, linkedin_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    company.id,
    company.domain,
    company.name,
    company.industry,
    company.sizeRange,
    company.country,
    company.linkedinUrl,
  );
  return company;
}
