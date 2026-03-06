import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: {
    kiwifyCheckoutUrlPersonalStandard: "https://pay.kiwify.com.br/personal-standard?src=orbita",
    kiwifyCheckoutUrlPersonalPro: "",
    kiwifyCheckoutUrlBusinessStandard: "",
    kiwifyCheckoutUrlBusinessPro: "",
    kiwifyOfferIdPersonalStandard: "",
    kiwifyOfferIdPersonalPro: "",
    kiwifyOfferIdBusinessStandard: "",
    kiwifyOfferIdBusinessPro: "",
  },
}));

import { resolveKiwifyCheckoutUrl } from "./_core/kiwify";

describe("resolveKiwifyCheckoutUrl", () => {
  it("appends supported Kiwify prefill parameters to checkout url", () => {
    const checkoutUrl = resolveKiwifyCheckoutUrl("personal_standard", {
      name: "Gustavo Silva",
      email: "GUSTAVO@EXAMPLE.COM ",
      phone: "+55 (11) 98888-7777",
      taxId: "390.533.447-05",
      region: "br",
    });

    expect(checkoutUrl).toBe(
      "https://pay.kiwify.com.br/personal-standard?src=orbita&name=Gustavo+Silva&email=gustavo%40example.com&phone=11988887777&cpf=39053344705&region=br",
    );
  });

  it("preserves the base checkout url when prefill is missing", () => {
    const checkoutUrl = resolveKiwifyCheckoutUrl("personal_standard");

    expect(checkoutUrl).toBe("https://pay.kiwify.com.br/personal-standard?src=orbita");
  });

  it("does not append cpf when the document is not an 11-digit cpf", () => {
    const checkoutUrl = resolveKiwifyCheckoutUrl("personal_standard", {
      taxId: "12.345.678/0001-99",
      phone: "+55 (11) 99999-0000",
      region: "br",
    });

    expect(checkoutUrl).toBe(
      "https://pay.kiwify.com.br/personal-standard?src=orbita&phone=11999990000&region=br",
    );
  });
});
