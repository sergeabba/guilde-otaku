// Admin requests use an HttpOnly same-origin session cookie instead of
// exposing a password or bearer token to JavaScript.
export function getAdminHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export function getAdminFormDataHeaders(): Record<string, string> {
  // The browser sets multipart/form-data boundary automatically.
  return {};
}
