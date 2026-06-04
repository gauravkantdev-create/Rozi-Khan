const VALID_ROLES = ["admin", "seller", "supplier", "user"];

export const getUserRole = (user) => {
  if (!user) return "user";

  const nestedRole = user.get?.("user.role") || user.user?.role;
  const topLevelRole = user.get?.("role") || user.role;

  if (VALID_ROLES.includes(nestedRole)) return nestedRole;
  if (VALID_ROLES.includes(topLevelRole)) return topLevelRole;

  return "user";
};
