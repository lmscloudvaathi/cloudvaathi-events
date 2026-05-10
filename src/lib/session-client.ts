/** Key used in localStorage for the session JWT (cross-tab sync listens for this key only). */
export const SESSION_TOKEN_STORAGE_KEY = "cv_session_token";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cv-auth-change"));
  }
}

export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  notifyAuthChanged();
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  notifyAuthChanged();
}
