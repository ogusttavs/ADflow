export const ACQUISITION_SOURCE_OPTIONS = [
  "Instagram",
  "Google",
  "YouTube",
  "TikTok",
  "Indicação",
  "WhatsApp",
  "Evento",
  "Outro",
] as const;

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatTaxId(value: string) {
  const digits = onlyDigits(value);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

export async function resolveBrazilZipCode(zipCode: string) {
  const zipDigits = onlyDigits(zipCode);
  if (zipDigits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${zipDigits}/json/`);
  if (!response.ok) {
    throw new Error("Falha ao consultar CEP");
  }

  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    cep?: string;
  };

  if (data.erro) return null;

  const addressBase = [
    data.logradouro?.trim(),
    data.bairro?.trim(),
    data.uf ? `${data.localidade?.trim() ?? ""} - ${data.uf}`.trim() : data.localidade?.trim(),
    data.cep?.trim() ? `CEP ${data.cep.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    city: data.localidade?.trim() ?? "",
    addressBase,
  };
}
