/**
 * `blocoDeModo` na prospecção fria: com `instrucaoManda` (campanha em "Prompt do agente") as
 * regras que mandam o CONTEÚDO da 1ª mensagem saem, para não brigarem com um "envie só a
 * saudação"; as que impedem inventar familiaridade ficam. Sem a flag, o bloco é o de sempre.
 */
import { describe, expect, it } from "vitest";

import { blocoDeModo } from "./abordagem-de-formulario";

const INSTRUCAO = "Envie só: Boa tarde, tudo bem?";

describe("blocoDeModo — prospeccao_fria", () => {
  it("sem a flag: mantém 'quem é você' e 'UMA pergunta' (o de sempre)", () => {
    const b = blocoDeModo("prospeccao_fria", "abc12345", INSTRUCAO);
    expect(b).toContain("Diga em uma frase quem é você");
    expect(b).toContain("Termine com UMA pergunta aberta");
    expect(b).toBe(blocoDeModo("prospeccao_fria", "abc12345", INSTRUCAO, false));
  });

  it("com a flag: a instrução manda; sai 'quem é você' e 'UMA pergunta'", () => {
    const b = blocoDeModo("prospeccao_fria", "abc12345", INSTRUCAO, true);
    expect(b).not.toContain("Diga em uma frase quem é você");
    expect(b).not.toContain("Termine com UMA pergunta");
    expect(b).toContain("envie SÓ a saudação");
    expect(b).toContain(INSTRUCAO);
  });

  it("com a flag: as regras contra inventar familiaridade continuam", () => {
    const b = blocoDeModo("prospeccao_fria", "abc12345", INSTRUCAO, true);
    expect(b).toContain("NÃO invente histórico, interesse, indicação ou contato anterior");
    expect(b).toContain("NÃO diga nem insinue que ela preencheu");
    expect(b).toContain("NÃO repita os dados em forma de lista");
    expect(b).toContain("Rascunho de abordagem");
    expect(b).toContain("no máximo 3 frases");
  });

  it("a flag não muda as outras origens", () => {
    expect(blocoDeModo("formulario", "n", INSTRUCAO, true)).toBe(blocoDeModo("formulario", "n", INSTRUCAO));
    expect(blocoDeModo("automacao", "n", INSTRUCAO, true)).toBe(blocoDeModo("automacao", "n", INSTRUCAO));
  });
});
