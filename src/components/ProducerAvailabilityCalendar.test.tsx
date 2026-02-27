import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProducerAvailabilityCalendar from "@/components/ProducerAvailabilityCalendar";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    role: "produtor",
    displayName: "Produtor 1",
    loading: false,
    signIn: vi.fn(),
    signUpWithRole: vi.fn(),
    createUserAsAdmin: vi.fn(),
    sendPasswordReset: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDemands", () => ({
  useDemands: () => ({
    demands: [],
    deliverables: [],
    isLoading: false,
    refetch: vi.fn(),
    updateStatusMutation: { mutateAsync: vi.fn() },
    deleteDemandMutation: { mutate: vi.fn() },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("ProducerAvailabilityCalendar", () => {
  it("renders title and description", () => {
    render(<ProducerAvailabilityCalendar userId="user-1" />);
    expect(screen.getByText("Meu calendário de términos")).toBeInTheDocument();
    expect(screen.getByText(/Cada demanda com término marcado ocupa automaticamente o dia correspondente/)).toBeInTheDocument();
  });
});
