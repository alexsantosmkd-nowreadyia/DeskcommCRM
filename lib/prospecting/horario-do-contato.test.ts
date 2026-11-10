import { describe, expect, it } from "vitest";

import { horarioDeEnvio } from "@/lib/prospecting/horario-do-contato";

describe("horarioDeEnvio — a hora que o modelo usa para o cumprimento", () => {
  it("manhã de Brasília (UTC-3): 09:30 vira bom dia", () => {
    expect(horarioDeEnvio(new Date("2026-11-10T12:30:00Z"))).toBe("09:30, manhã (bom dia)");
  });
  it("tarde: 15:00 vira boa tarde", () => {
    expect(horarioDeEnvio(new Date("2026-11-10T18:00:00Z"))).toBe("15:00, tarde (boa tarde)");
  });
  it("noite: 23:05 vira boa noite, e a meia-noite não sai como 24", () => {
    expect(horarioDeEnvio(new Date("2026-11-11T02:05:00Z"))).toBe("23:05, noite (boa noite)");
    expect(horarioDeEnvio(new Date("2026-11-11T03:00:00Z"))).toBe("00:00, noite (boa noite)");
  });
});
