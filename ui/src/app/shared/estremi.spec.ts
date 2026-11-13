import { describe, expect, it } from 'vitest';
import { estremiLabel } from './estremi';

describe('estremiLabel', () => {
  it('should not repeat the year when the code already contains it', () => {
    expect(estremiLabel('10/DZPaU/2026/MP', 2026)).toBe('10/DZPaU/2026/MP');
    expect(estremiLabel('7/2026', 2026)).toBe('7/2026');
    expect(estremiLabel('MF/013819/2025-74', 2025)).toBe('MF/013819/2025-74');
  });

  it('should append the year when the code does not contain it', () => {
    expect(estremiLabel('N12', 2019)).toBe('N12/2019');
    expect(estremiLabel('1/OFS', 2020)).toBe('1/OFS/2020');
  });

  it('should return the code alone when the year is unknown', () => {
    expect(estremiLabel('10/DZPaU/2026/MP', null)).toBe('10/DZPaU/2026/MP');
  });
});
