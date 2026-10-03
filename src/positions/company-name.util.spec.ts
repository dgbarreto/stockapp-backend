import { formatCompanyName } from './company-name.util';

describe('formatCompanyName', () => {
  it('usa o nome fantasia + classe', () => {
    expect(formatCompanyName('PETRÓLEO BRASILEIRO S.A. - PETROBRAS', 'PETR4', 'STOCK')).toBe('Petrobras PN');
  });
  it('remove S.A. quando não há nome fantasia', () => {
    expect(formatCompanyName('VALE S.A.', 'VALE3', 'STOCK')).toBe('Vale ON');
  });
  it('mantém o nome do FII como veio', () => {
    expect(formatCompanyName('CSHG Logística', 'HGLG11', 'FII')).toBe('CSHG Logística');
  });
  it('devolve null sem nome', () => {
    expect(formatCompanyName(null, 'PETR4', 'STOCK')).toBeNull();
  });
});