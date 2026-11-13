/**
 * The number of a document as the Screens show it. The Slovak `numero` is the code of the document (`10/DZPaU/2026/MP`, `7/2026`, `MF/013819/2025-74`) and
 * almost always carries the year already: the year is appended (`numero/anno`, the Italian habit) only when the code does not contain it (live fix P81b-35).
 */
export function estremiLabel(numero: string, anno: number | null): string {
  if (anno === null || numero.includes(String(anno))) {
    return numero;
  }
  return `${numero}/${String(anno)}`;
}
