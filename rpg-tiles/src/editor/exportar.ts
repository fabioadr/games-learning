// Ensina: serialização. O mapa em memória vira texto TypeScript no mesmo estilo de
// dados/mapas.ts, pronto para colar. É o caminho "editor -> código" do conteúdo.

import type { MapaDef } from '../tipos';

const IDENTIFICADOR = /^[A-Za-z_$][\w$]*$/;
const LARGURA = 100;

const texto = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
const chave = (k: string) => (IDENTIFICADOR.test(k) ? k : texto(k));

/** Valor -> literal TS. Cabe numa linha? fica numa linha. Senão, quebra. `linhas` sempre quebra. */
function paraTS(v: unknown, nivel: number, nomeChave = ''): string {
  if (typeof v === 'string') return texto(v);
  if (typeof v !== 'object' || v === null) return String(v);

  const pad = '  '.repeat(nivel), dentro = '  '.repeat(nivel + 1);
  const itens = Array.isArray(v)
    ? v.map((i) => paraTS(i, nivel + 1))
    : Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${chave(k)}: ${paraTS(x, nivel + 1, k)}`);
  const [abre, fecha] = Array.isArray(v) ? ['[', ']'] : ['{ ', ' }'];
  if (!itens.length) return Array.isArray(v) ? '[]' : '{}';

  const umaLinha = `${abre}${itens.join(', ')}${fecha}`;
  if (nomeChave !== 'linhas' && !umaLinha.includes('\n') && pad.length + umaLinha.length <= LARGURA) return umaLinha;
  return `${abre.trim()}\n${itens.map((i) => dentro + i + ',').join('\n')}\n${pad}${fecha.trim()}`;
}

/** A entrada inteira do mapa em MAPAS: `  id: { ... },` */
export function codigoDoMapa(m: MapaDef): string {
  return `  ${chave(m.id)}: ${paraTS(m, 1)},`;
}
