import { describe, expect, it, vi } from "vitest";

import { pausarCampanha } from "./pausa";
import { ProspectingError } from "./provider";

const ORG = "99999999-9999-4999-8999-999999999999";
const ID = "11111111-1111-4111-8111-111111111111";

function pool(...respostas: Array<{ rows: unknown[] } | Error>) {
  const query = vi.fn(async () => {
    const r = respostas.shift();
    if (r instanceof Error) throw r;
    return r ?? { rows: [] };
  });
  return { query } as unknown as Parameters<typeof pausarCampanha>[2] & { query: typeof query };
}

describe("pausarCampanha", () => {
  it("pausa a campanha em execução da organização dada", async () => {
    const p = pool({ rows: [{ id: ID }] });
    await expect(pausarCampanha(ORG, ID, p)).resolves.toEqual({ paused: true });
    const [sql, params] = p.query.mock.calls[0] as unknown as [string, string[]];
    expect(sql).toContain("organization_id=$1");
    expect(sql).toContain("status='running'");
    expect(params).toEqual([ORG, ID]);
  });

  it("repetição depois de a primeira ter chegado ao banco: já pausada conta como pausada", async () => {
    const p = pool({ rows: [] }, { rows: [{ status: "paused" }] });
    await expect(pausarCampanha(ORG, ID, p)).resolves.toEqual({ paused: true, ja_estava: true });
    const [sql, params] = p.query.mock.calls[1] as unknown as [string, string[]];
    expect(sql).toContain("organization_id=$1");
    expect(params).toEqual([ORG, ID]);
  });

  it("campanha que não está em execução nem pausada (ou de outra organização): 404", async () => {
    for (const segunda of [{ rows: [] }, { rows: [{ status: "completed" }] }]) {
      const p = pool({ rows: [] }, segunda);
      const erro = await pausarCampanha(ORG, ID, p).catch((e: unknown) => e);
      expect(erro).toBeInstanceOf(ProspectingError);
      expect((erro as ProspectingError).status).toBe(404);
    }
  });

  it.each([
    "timeout exceeded when trying to connect",
    "Query read timeout",
    "(ECHECKOUTTIMEOUT) unable to check out connection from the pool due to timeout",
  ])("banco ocupado (%s) vira 503 rápido, não pendura", async (mensagem) => {
    const p = pool(new Error(mensagem));
    const erro = await pausarCampanha(ORG, ID, p).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ProspectingError);
    expect((erro as ProspectingError).status).toBe(503);
  });

  it("erro que não é de espera segue como erro (não vira 503 mascarado)", async () => {
    const p = pool(new Error('relation "prospecting_campaigns" does not exist'));
    const erro = await pausarCampanha(ORG, ID, p).catch((e: unknown) => e);
    expect(erro).not.toBeInstanceOf(ProspectingError);
  });
});
