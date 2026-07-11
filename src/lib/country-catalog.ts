import type { Continent } from "@/types/country";

const continentCodes: Record<Continent, Set<string>> = {
  Europe: new Set("AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA".split(" ")),
  Asia: new Set("AF AM AZ BH BD BT BN KH CN GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE".split(" ")),
  Africa: new Set("DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW".split(" ")),
  "North America": new Set("AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US GL BM KY PR VI VG AW CW BQ SX TC MS GP MQ BL MF".split(" ")),
  "South America": new Set("AR BO BR CL CO EC FK GF GY PY PE SR UY VE".split(" ")),
  Oceania: new Set("AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU AS CK NU NF NC PF GU MP PN WF".split(" ")),
  Antarctica: new Set("AQ BV GS HM TF".split(" ")),
};

export function getContinentForCountryCode(code: string): Continent {
  const normalized = code.toUpperCase();
  return (
    Object.entries(continentCodes).find(([, codes]) => codes.has(normalized))?.[0] as Continent
  ) ?? "Europe";
}

export function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(127397 + letter.charCodeAt(0)),
    );
}
