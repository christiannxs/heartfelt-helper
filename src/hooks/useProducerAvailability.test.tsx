import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMyAvailability, useProducerAvailabilityForView } from "@/hooks/useProducerAvailability";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMyAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data and mutations when userId is provided", async () => {
    const { result } = renderHook(() => useMyAvailability("user-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(typeof result.current.insertSlot).toBe("function");
    expect(typeof result.current.deleteSlot).toBe("function");
    expect(result.current.isInserting).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it("does not fetch when userId is undefined", () => {
    const { result } = renderHook(() => useMyAvailability(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
  });
});

describe("useProducerAvailabilityForView", () => {
  it("returns data when enabled", async () => {
    const { result } = renderHook(() => useProducerAvailabilityForView(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});
