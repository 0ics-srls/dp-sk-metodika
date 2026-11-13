import { FONTI } from '../tools/metodika-dto';

/** The sources the Screens offer as a filter, in display order. */
export const FONTE_CHOICES: readonly string[] = FONTI;

/** The translation key of a source the package knows, null for any other (then the raw name is shown). */
export function fonteKey(fonte: string | null): string | null {
  return fonte !== null && FONTI.includes(fonte) ? `common.fonti.${fonte}` : null;
}

/** The licence note of a source: NBS asks for unaltered files, the terms of the others are not published. */
export function licenceKey(fonte: string | null): 'document.licence.nbs' | 'document.licence.other' {
  return fonte === 'nbs-metodicke' ? 'document.licence.nbs' : 'document.licence.other';
}
