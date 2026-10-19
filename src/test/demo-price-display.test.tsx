import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TaxDisclosure } from "@/features/fixhub/app-screens";
import { FixHubProvider, useFixHub } from "@/features/fixhub/context";
import { calculate, initialPolicy } from "@/features/fixhub/demo-model";
import { PriceBreakdown } from "@/features/fixhub/demo-price";

function LanguageControl() {
  const { setLocale } = useFixHub();
  return <button onClick={() => setLocale("te-IN")}>తెలుగుకు మార్చండి</button>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("demo price tax disclosure", () => {
  it("shows the tax exclusion beside the service estimate before booking", () => {
    const price = calculate(initialPolicy.plumbing);
    render(
      <FixHubProvider>
        <div className="app-price-box">
          <TaxDisclosure price={price} locale="en-IN" />
        </div>
      </FixHubProvider>,
    );

    const taxLabel = screen.getByText("Tax", { exact: true });
    expect(taxLabel.parentElement).toHaveTextContent("Not configured");
    expect(taxLabel.parentElement).not.toHaveTextContent("₹0.00");
    expect(screen.getByText(/excluded from this estimate/i)).toBeInTheDocument();
  });

  it("does not imply checkout or present an unconfigured tax as zero", () => {
    render(
      <FixHubProvider>
        <PriceBreakdown price={calculate(initialPolicy.plumbing)} />
      </FixHubProvider>,
    );

    const taxLabel = screen.getByText("Tax", { exact: true });
    expect(taxLabel.parentElement).toHaveTextContent("Not configured");
    expect(taxLabel.parentElement).not.toHaveTextContent("₹0.00");
    expect(screen.getByText(/excluded from this estimate/i)).toBeInTheDocument();
    expect(screen.queryByText(/at checkout/i)).not.toBeInTheDocument();
  });

  it("localizes the unknown-tax status and warning in Telugu", () => {
    render(
      <FixHubProvider>
        <LanguageControl />
        <PriceBreakdown price={calculate(initialPolicy.plumbing)} />
      </FixHubProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "తెలుగుకు మార్చండి" }));
    expect(screen.getByText("పన్ను", { exact: true }).parentElement).toHaveTextContent(
      "కాన్ఫిగర్ చేయలేదు",
    );
    expect(screen.getByText(/ఈ అంచనాలో చేర్చలేదు/)).toBeInTheDocument();
  });
});
