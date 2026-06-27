import { addDays, formatDateKey } from "./dateUtils";

export type HolidayType = "nacional" | "estadual" | "municipal";

export interface Holiday {
  dateKey: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
}

/** Domingo de Páscoa pelo algoritmo de Gauss/Computus (data local). */
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Feriados de Indaiatuba/SP (nacionais, estadual SP e municipais) para o ano. */
export function getHolidays(year: number): Holiday[] {
  const easter = computeEaster(year);

  const entries: { date: Date; name: string; type: HolidayType }[] = [
    { date: addDays(easter, -48), name: "Carnaval (segunda)", type: "nacional" },
    { date: addDays(easter, -47), name: "Carnaval (terça)", type: "nacional" },
    { date: addDays(easter, -46), name: "Quarta-feira de Cinzas", type: "nacional" },
    { date: addDays(easter, -2), name: "Sexta-feira Santa", type: "nacional" },
    { date: addDays(easter, 60), name: "Corpus Christi", type: "nacional" },
    { date: new Date(year, 0, 1), name: "Confraternização Universal", type: "nacional" },
    { date: new Date(year, 3, 21), name: "Tiradentes", type: "nacional" },
    { date: new Date(year, 4, 1), name: "Dia do Trabalho", type: "nacional" },
    { date: new Date(year, 6, 9), name: "Revolução Constitucionalista (SP)", type: "estadual" },
    { date: new Date(year, 8, 7), name: "Independência do Brasil", type: "nacional" },
    { date: new Date(year, 9, 12), name: "Nossa Senhora Aparecida", type: "nacional" },
    { date: new Date(year, 10, 2), name: "Finados", type: "nacional" },
    { date: new Date(year, 10, 15), name: "Proclamação da República", type: "nacional" },
    { date: new Date(year, 10, 20), name: "Consciência Negra", type: "nacional" },
    { date: new Date(year, 11, 8), name: "Nossa Senhora da Conceição (Padroeira de Indaiatuba)", type: "municipal" },
    { date: new Date(year, 11, 9), name: "Aniversário de Indaiatuba", type: "municipal" },
    { date: new Date(year, 11, 25), name: "Natal", type: "nacional" },
  ];

  return entries
    .map(({ date, name, type }) => ({ dateKey: formatDateKey(date), name, type }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
