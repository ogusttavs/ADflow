const NON_DIGIT_REGEX = /\D/g;

export type TaxIdType = "cpf" | "cnpj";

export function stripTaxId(raw: string): string {
  return raw.replace(NON_DIGIT_REGEX, "");
}

function hasAllEqualDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

function calculateCpfVerifier(cpfDigits: string, factor: number): number {
  let total = 0;

  for (let index = 0; index < factor - 1; index += 1) {
    total += Number(cpfDigits[index] ?? 0) * (factor - index);
  }

  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function calculateCnpjVerifier(cnpjDigits: string, multipliers: number[]): number {
  let total = 0;

  for (let index = 0; index < multipliers.length; index += 1) {
    total += Number(cnpjDigits[index] ?? 0) * multipliers[index];
  }

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(raw: string): boolean {
  const digits = stripTaxId(raw);
  if (digits.length !== 11 || hasAllEqualDigits(digits)) return false;

  const firstVerifier = calculateCpfVerifier(digits, 10);
  const secondVerifier = calculateCpfVerifier(digits, 11);

  return (
    firstVerifier === Number(digits[9]) &&
    secondVerifier === Number(digits[10])
  );
}

export function isValidCnpj(raw: string): boolean {
  const digits = stripTaxId(raw);
  if (digits.length !== 14 || hasAllEqualDigits(digits)) return false;

  const firstVerifier = calculateCnpjVerifier(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondVerifier = calculateCnpjVerifier(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return (
    firstVerifier === Number(digits[12]) &&
    secondVerifier === Number(digits[13])
  );
}

export function detectTaxIdType(raw: string): TaxIdType | null {
  const digits = stripTaxId(raw);
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return null;
}

export function isValidTaxId(raw: string): boolean {
  const type = detectTaxIdType(raw);
  if (type === "cpf") return isValidCpf(raw);
  if (type === "cnpj") return isValidCnpj(raw);
  return false;
}

export function normalizeTaxId(raw: string): { digits: string; type: TaxIdType } | null {
  if (!isValidTaxId(raw)) return null;
  const digits = stripTaxId(raw);
  const type = digits.length === 11 ? "cpf" : "cnpj";
  return { digits, type };
}
