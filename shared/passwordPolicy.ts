export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_HINT =
  "Use pelo menos 8 caracteres, sem espaços, com letra maiúscula, minúscula, número e caractere especial.";

export function getPasswordPolicyErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
  if (/\s/.test(password)) {
    errors.push("A senha não pode conter espaços.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("A senha precisa de pelo menos uma letra minúscula.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha precisa de pelo menos uma letra maiúscula.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("A senha precisa de pelo menos um número.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("A senha precisa de pelo menos um caractere especial.");
  }

  return errors;
}

export function getPasswordPolicyError(password: string): string | null {
  const errors = getPasswordPolicyErrors(password);
  return errors.length > 0 ? errors[0] : null;
}
