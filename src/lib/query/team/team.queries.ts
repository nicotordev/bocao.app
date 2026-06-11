import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTeamPageData } from "@/lib/query/team/team.api";
import { teamKeys } from "@/lib/query/team/team.keys";

export function teamPageQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: teamKeys.members(organizationId),
    queryFn: fetchTeamPageData,
    enabled: organizationId.length > 0,
  });
}

export function useTeamPageQuery(organizationId: string) {
  return useQuery(teamPageQueryOptions(organizationId));
}
