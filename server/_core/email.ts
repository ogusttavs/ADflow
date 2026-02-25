import { ENV } from "./env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function normalizeProvider() {
  return ENV.emailProvider.trim().toLowerCase();
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  const provider = normalizeProvider();
  const shouldUseMock = !ENV.isProduction || provider === "mock";

  if (shouldUseMock) {
    // In development, we intentionally log the generated link for manual flow testing.
    console.log("[Email:mock]", {
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return;
  }

  if (provider !== "resend") {
    throw new Error(`EMAIL_PROVIDER inválido para produção: ${provider || "(vazio)"}`);
  }

  if (!ENV.resendApiKey) {
    throw new Error("RESEND_API_KEY não configurada");
  }
  if (!ENV.emailFrom) {
    throw new Error("EMAIL_FROM não configurado");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.emailFrom,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Resend retornou erro ${response.status}: ${responseBody.slice(0, 300)}`);
  }
}

