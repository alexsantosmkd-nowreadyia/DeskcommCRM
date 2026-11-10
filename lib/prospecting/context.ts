import type { Queryable } from "@/lib/agent-engine/queue/queue";
import { ROTULOS_DAS_OFERTAS, campaignConfigSchema } from "./schema";

/** Trusted operator criteria; scraped websites never become system instructions. */
export async function prospectingConversationContext(
  db: Queryable,
  org: string,
  conversationId: string,
) {
  const { rows } = await db.query<{ config: unknown }>(
    "select c.config from prospecting_candidates p join prospecting_campaigns c on c.organization_id=p.organization_id and c.id=p.campaign_id where p.organization_id=$1 and p.conversation_id=$2 and p.status in ('sending','sent') limit 1",
    [org, conversationId],
  );
  const parsed = campaignConfigSchema.safeParse(rows[0]?.config);
  if (!parsed.success) return "";
  const c = parsed.data;
  // Só site é o padrão (`emptyConfig` nasce com ele marcado): quem não mexeu nas caixinhas e
  // vende outra coisa pelo campo livre não pode passar a ler, em todo turno, que vende site.
  const soSite = c.ofertas.length === 1 && c.ofertas[0] === "site";
  const linhaDasOfertas = soSite
    ? ""
    : `\nO que esta campanha vende, em ordem: ${c.ofertas.map((o) => ROTULOS_DAS_OFERTAS[o]).join("; ")}.`;
  return `\n\nEsta conversa veio de uma campanha de prospecção. Objetivo definido pelo operador: ${c.instruction}\nCritérios de qualificação a confirmar com a pessoa: ${c.qualification}${linhaDasOfertas}\nConverse naturalmente, uma pergunta por vez. Uma empresa da lista da campanha ainda não é um cliente qualificado. Registre o que a pessoa confirmar, sem inventar necessidade, orçamento ou interesse. Só depois de confirmar os critérios, use as ferramentas disponíveis para mover o negócio do funil ${c.pipeline_id} para a etapa ${c.qualified_stage_id}. Explique a evidência no registro. Se faltar informação, continue qualificando. Respeite recusa, opt-out e intervenção humana; não prometa condições fora da política do agente.`;
}
