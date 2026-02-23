import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProducerAvailabilityCalendar from "@/components/ProducerAvailabilityCalendar";

vi.mock("@/hooks/useProducerAvailability", () => ({
  useMyAvailability: vi.fn(() => ({
    data: [],
    isLoading: false,
    insertSlot: vi.fn(),
    deleteSlot: vi.fn(),
    isInserting: false,
    isDeleting: false,
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("ProducerAvailabilityCalendar", () => {
  it("renders title and description", () => {
    render(<ProducerAvailabilityCalendar userId="user-1" />);
    expect(screen.getByText("Minha disponibilidade")).toBeInTheDocument();
    expect(screen.getByText(/Clique em um dia e escolha/)).toBeInTheDocument();
  });

  it("shows hint when no date selected", () => {
    render(<ProducerAvailabilityCalendar userId="user-1" />);
    expect(screen.getByText("Clique em um dia no calendário.")).toBeInTheDocument();
  });
});
