import { useUserRole } from "@/hooks/useUserRole";

export function useAdmin() {
  const { user, isAdmin, loading } = useUserRole();
  return { user, isAdmin, loading };
}
