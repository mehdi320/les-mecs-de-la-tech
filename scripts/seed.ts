import { getDb } from "@/shared/integration/db";
import { SqliteClientRepository } from "@/shared/integration/client-repository";

function run() {
  const db = getDb();
  const repo = new SqliteClientRepository(db);

  const existing = repo.findById("demo-client");
  if (existing) {
    console.log("Client de demo deja present.");
    return;
  }

  const client = repo.create({ id: "demo-client", nom: "Client de demonstration", planId: "starter" });
  repo.signDpa(client.id, "brouillon-v0");
  console.log(`Client de demo cree : ${client.id}`);
}

run();
