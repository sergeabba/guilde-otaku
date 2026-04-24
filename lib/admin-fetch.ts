export function getAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("guilde_admin_auth") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function getAdminFormDataHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("guilde_admin_auth") || "";
  return {
    Authorization: `Bearer ${token}`,
  };
}
