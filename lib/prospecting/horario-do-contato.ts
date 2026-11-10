/**
 * A hora de envio, lida pelo modelo para escolher o cumprimento ("bom dia",
 * "boa tarde", "boa noite"). Sem isto o modelo não sabe que horas são e cai
 * sempre no "oi". Fuso fixo de Brasília: o produto hoje é para o mercado
 * brasileiro; o mesmo fuso que a janela de envio já usa.
 */
export function horarioDeEnvio(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const hora = Number(partes.find((p) => p.type === "hour")?.value);
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "00";
  // Madrugada (antes das 5h) é noite: ninguém quer um "bom dia" à meia-noite.
  const periodo =
    hora < 5 || hora >= 18 ? "noite (boa noite)" : hora < 12 ? "manhã (bom dia)" : "tarde (boa tarde)";
  return `${String(hora).padStart(2, "0")}:${minuto}, ${periodo}`;
}
