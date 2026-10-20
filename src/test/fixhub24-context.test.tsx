import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FixHub24Provider, useFixHub24 } from "@/features/fixhub24/context";

function Consumer() {
  const { t, draft, updateDraft, setLocale } = useFixHub24();
  return (
    <>
      <span>{t("home")}</span>
      <input
        aria-label="draft"
        value={draft.problem}
        onChange={(e) => updateDraft({ problem: e.target.value })}
      />
      <button onClick={() => setLocale("te-IN")}>Switch</button>
    </>
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("FixHub24 shared context", () => {
  it("connects consumers and retains drafts when language changes", () => {
    render(
      <FixHub24Provider>
        <Consumer />
      </FixHub24Provider>,
    );
    fireEvent.change(screen.getByLabelText("draft"), { target: { value: "Leaking tap" } });
    fireEvent.click(screen.getByText("Switch"));
    expect(screen.getByText("హోమ్")).toBeInTheDocument();
    expect(screen.getByLabelText("draft")).toHaveValue("Leaking tap");
  });
});
