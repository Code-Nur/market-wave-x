export type UserRole = "admin" | "seller" | "user";

export function normalizeRole(value: unknown): UserRole {
  return value === "admin" || value === "seller" ? value : "user";
}

export function getHomePathByRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "seller":
      return "/seller";
    default:
      return "/my-orders";
  }
}
