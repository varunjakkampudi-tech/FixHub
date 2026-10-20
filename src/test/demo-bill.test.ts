import { describe, expect, it } from "vitest";

import { calculate, initialPolicy } from "@/features/fixhub24/demo-model";
import { demoBillLines, demoServiceRecordFile } from "@/features/fixhub24/demo-bill";

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

  it("provides a direct UTF-8 download with itemized demo charges and truthful exclusions", () => {
    const file = demoServiceRecordFile(
      "FH-123",
      "Electrical repair",
      calculate(initialPolicy.plumbing),
      "en-IN",
    );
    expect(file.filename).toBe("fixhub24-demo-service-record-FH-123.txt");
    expect(file.href).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(decodeURIComponent(file.href.slice(file.href.indexOf(",") + 1))).toBe(file.content);
    expect(file.content).toContain("FIXHUB2424 — SERVICE RECORD · DEMO");
    expect(file.content).toContain("Reference: FH-123");
    expect(file.content).toContain("Service: Electrical repair");
    expect(file.content).toContain("Visit charge: ₹149");
    expect(file.content).toContain("Tax: Not configured in this demo");
    expect(file.content).toContain("Approved total: ₹649");
    expect(file.content).toContain("NOT A TAX INVOICE OR PAYMENT RECEIPT");
    expect(file.content).not.toContain("Private address");
  });

  it("localizes the download and prevents user-supplied line breaks or unsafe filename characters", () => {
    const file = demoServiceRecordFile(
      "../FH\nPAID",
      "Repair\nPaid",
      calculate(initialPolicy.electrician),
      "te-IN",
    );
    expect(file.filename).toBe("fixhub24-demo-service-record-FH-PAID.txt");
    expect(file.content).toContain("ఫిక్స్ హబ్ — సేవా రికార్డు · డెమో");
    expect(file.content).toContain("రిఫరెన్స్: ../FH PAID");
    expect(file.content).toContain("సేవ: Repair Paid");
    expect(file.content).not.toContain("\nPAID");
  });
});
