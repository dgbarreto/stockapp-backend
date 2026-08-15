import * as XLSX from 'xlsx';

export interface B3NegociacaoRow {
  'Data do Negócio': string;
  'Tipo de Movimentação': string;
  Mercado: string;
  'Prazo/Vencimento': string | null;
  Instituição: string;
  'Código de Negociação': string;
  Quantidade: number;
  Preço: number;
  Valor: number;
}

export function parseB3NegociacaoFile(buffer: Buffer): B3NegociacaoRow[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    workbook = XLSX.read(buffer.toString('utf-8'), { type: 'string' });
  }

  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json<B3NegociacaoRow>(workbook.Sheets[sheetName], {
    defval: null,
  });
}

export function parseBrDate(value: string): Date {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
