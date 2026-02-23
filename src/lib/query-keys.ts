/** Factory de query keys para evitar strings soltas e invalidar de forma consistente. */
export const queryKeys = {
  demands: {
    all: ["demands"] as const,
  },
  deliverables: {
    all: ["deliverables"] as const,
  },
  producerAvailability: {
    all: (userId: string | undefined) => ["producer-availability", userId] as const,
    view: ["producer-availability-view"] as const,
  },
  setupStatus: {
    all: ["setupStatus"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  producers: {
    all: (role: string | null) => ["producers", role] as const,
  },
} as const;
