import { z } from "zod";
import { TEAM_PERMISSIONS, TEAM_ROLES } from "@/lib/team/permissions";

const teamRoleSchema = z.enum(TEAM_ROLES);

const teamPermissionSchema = z.enum(TEAM_PERMISSIONS);

export const inviteMemberBodySchema = z.object({
  email: z.string().trim().email().max(320),
  role: teamRoleSchema,
  restaurantIds: z.array(z.string().cuid()).optional(),
  customPermissions: z.array(teamPermissionSchema).optional(),
});

export const updateMemberBodySchema = z
  .object({
    role: teamRoleSchema.optional(),
    customPermissions: z.array(teamPermissionSchema).nullable().optional(),
    restaurantIds: z.array(z.string().cuid()).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.customPermissions !== undefined ||
      value.restaurantIds !== undefined ||
      value.status !== undefined,
    { message: "At least one field must be provided" },
  );

export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>;
export type UpdateMemberBody = z.infer<typeof updateMemberBodySchema>;
