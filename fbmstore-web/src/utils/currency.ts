export function brlToNumber(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  // Remove "R$", spaces, thousands separator '.', replace decimal ',' with '.'
  const norm = v.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

export function numberToBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
