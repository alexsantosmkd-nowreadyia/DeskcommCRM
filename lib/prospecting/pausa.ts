/**
 * PAUSAR UMA CAMPANHA SEM ESPERAR NA FILA DAS LEITURAS.
 *
 * O "Pausar abordagens" é um `UPDATE` de uma linha, mas ele rodava no pool geral
 * do app (`getRequestPool`, até 10 conexões, SEM teto de espera). A leitura da
 * tela (`GET /api/v1/prospecting`) dispara 7 consultas em paralelo e ocupa 7 das
 * 10 vagas; com a lista levando ~25 s e o cliente repetindo-a, o `UPDATE` ficava
 * na fila até o navegador desistir aos 30 s — "A requisição não respondeu em
 * 30000ms" — sem a pessoa saber se a campanha pausou.
 *
 * Aqui o pool é outro, pequeno, e a espera é curta: sem vaga em poucos segundos
 * a resposta é 503 (o cliente já repete 503) em vez de pendurar.
 *
 * IDEMPOTENTE: se o `UPDATE` chegou ao banco e só a resposta se perdeu, a
 * repetição não acha campanha `running` — e responderia 404 sobre uma campanha
 * que JÁ pausou. Quando não há `running`, a campanha `paused` da própria
 * organização conta como pausada.
 */
import type pg from "pg";

import { createPool } from "@/lib/agent-engine/db/pool";

import { ProspectingError } from "./provider";

export const ESPERA_POR_CONEXAO_DA_PAUSA_MS = 5_000;
export const TETO_DA_QUERY_DA_PAUSA_MS = 10_000;

let _pool: pg.Pool | null = null;

function poolDaPausa(): pg.Pool {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL ausente — pausa indisponível");
  if (!_pool) {
    _pool = createPool(url, undefined, {
      max: 2,
      connectionTimeoutMillis: ESPERA_POR_CONEXAO_DA_PAUSA_MS,
      queryTimeoutMillis: TETO_DA_QUERY_DA_PAUSA_MS,
    });
  }
  return _pool;
}

/** Espera de vaga no pool, ou query lenta demais — o banco está ocupado, não quebrado. */
function bancoOcupado(erro: unknown): boolean {
  const msg = erro instanceof Error ? erro.message : "";
  return /timeout exceeded when trying to connect|Query read timeout|ECHECKOUTTIMEOUT/i.test(msg);
}

export async function pausarCampanha(
  organizationId: string,
  campaignId: string,
  pool: Pick<pg.Pool, "query"> = poolDaPausa(),
): Promise<{ paused: true; ja_estava?: true }> {
  try {
    const mudou = await pool.query(
      "update prospecting_campaigns set status='paused',updated_at=now() where organization_id=$1 and id=$2 and status='running' returning id",
      [organizationId, campaignId],
    );
    if (mudou.rows.length) return { paused: true };
    const atual = await pool.query<{ status: string }>(
      "select status from prospecting_campaigns where organization_id=$1 and id=$2",
      [organizationId, campaignId],
    );
    if (atual.rows[0]?.status === "paused") return { paused: true, ja_estava: true };
  } catch (erro) {
    if (bancoOcupado(erro))
      throw new ProspectingError(
        "O banco está ocupado agora. Tente pausar de novo em instantes.",
        503,
      );
    throw erro;
  }
  throw new ProspectingError("Campanha em execução não encontrada.", 404);
}
