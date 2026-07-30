import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonthlyGivingSetup from "../MonthlyGivingSetup";

const mockOnClose = jest.fn();
const mockOnCreated = jest.fn();

function renderSetup() {
  return render(
    <MonthlyGivingSetup
      projectId="proj-1"
      projectName="Test Project"
      onClose={mockOnClose}
      onCreated={mockOnCreated}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // Mock localStorage for the monthly subscriptions storage
  const storage: Record<string, string> = {};
  jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => storage[key] ?? null);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => { storage[key] = value; });
});

describe("MonthlyGivingSetup amount validation", () => {
  it("shows inline error for amount below 1 XLM", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0.5" } });

    expect(screen.getByText("Minimum recurring donation is 1 XLM")).toBeInTheDocument();
  });

  it("shows inline error for 0 XLM", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0" } });

    expect(screen.getByText("Minimum recurring donation is 1 XLM")).toBeInTheDocument();
  });

  it("shows inline error for negative amount", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "-5" } });

    expect(screen.getByText("Minimum recurring donation is 1 XLM")).toBeInTheDocument();
  });

  it("removes inline error when amount becomes valid", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0.5" } });
    expect(screen.getByText("Minimum recurring donation is 1 XLM")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "5" } });
    expect(screen.queryByText("Minimum recurring donation is 1 XLM")).not.toBeInTheDocument();
  });

  it("disables submit button when amount is below 1 XLM", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0.5" } });

    expect(screen.getByRole("button", { name: /save monthly giving/i })).toBeDisabled();
  });

  it("enables submit button when amount is 1 XLM", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "1" } });

    expect(screen.getByRole("button", { name: /save monthly giving/i })).not.toBeDisabled();
  });

  it("enables submit button when amount is above 1 XLM", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "10" } });

    expect(screen.getByRole("button", { name: /save monthly giving/i })).not.toBeDisabled();
  });

  it("sets aria-invalid on amount input when value is invalid", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0.5" } });

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when amount is valid", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "5" } });

    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("links error message with aria-describedby", () => {
    renderSetup();

    const input = screen.getByLabelText("Amount (XLM)");
    fireEvent.change(input, { target: { value: "0.5" } });

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent("Minimum recurring donation is 1 XLM");
  });
});
