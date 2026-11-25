import { MODOS, BASE } from './modos.js';

// Como artefato do Claude usa o recurso "sample" (sem chave nem servidor); no site usa o proxy /api/formalizar.
export async function pedirIA(texto, modo) {
  const sample = await window.claude?.use?.('sample').catch(() => null);
  if (sample) {
    try { return (await sample(`${MODOS[modo]}${BASE}\n\nTEXTO:\n${texto}`, { cache: false })).text; }
    catch (e) { throw new Error(e.code === 'not_granted' ? 'Permita o uso do Claude para usar a IA.' : e.code === 'rate_limited' ? 'Muitas requisições. Tente de novo em instantes.' : 'A IA está indisponível agora. Tente de novo.'); }
  }
  const res = await fetch('/api/formalizar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texto, modo }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.erro);
  return j.texto;
}
