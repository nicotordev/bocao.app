export const teamKeys = {
  all: ["team"] as const,
  members: (organizationId: string) =>
    [...teamKeys.all, "members", organizationId] as const,
  invitations: (organizationId: string) =>
    [...teamKeys.all, "invitations", organizationId] as const,
};
