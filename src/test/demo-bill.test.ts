import { describe, expect, it } from "vitest";

import { calculate, initialPolicy } from "@/features/fixhub/demo-model";
import { demoBillLines } from "@/features/fixhub/demo-bill";

describe("demo service bill", () => {
  it("shows the complete customer price breakdown and marks tax as unconfigured", () => {
    const price = calculate(initialPolicy.plumbing);
    expect(demoBillLines(price, "en-IN")).toEqual([
      { label: "Visit charge", amount: 149 },
      { label: "Labour", amount: 350 },
      { label: "Parts allowance", amount: 150 },
      { label: "Platform fee", amount: 0 },
      { label: "Discount", amount: 0 },
      { label: "Tax", amount: null, note: "Not configured in this demo" },
    ]);
    expect(price.total).toBe(649);
  });

  it("localizes line labels for Telugu customers", () => {
    const lines = demoBillLines(calculate(initialPolicy.electrician), "te-IN");
    expect(lines[0]?.label).toBe("సందర్శన ఛార్జీ");
    expect(lines.at(-1)).toMatchObject({ amount: null, note: "ఈ డెమోలో కాన్ఫిగర్ చేయలేదు" });
  });
});
