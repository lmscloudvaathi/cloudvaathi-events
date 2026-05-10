import { useEffect, useState } from "react";
import { meFn } from "@/lib/rpc";
import { getSessionToken, SESSION_TOKEN_STORAGE_KEY } from "@/lib/session-client";

function isSessionTokenStorageEvent(e: StorageEvent): boolean {
  if (e.storageArea !== localStorage) return false;
  if (e.key === null) return true;
  return e.key === SESSION_TOKEN_STORAGE_KEY;
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getSessionToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await meFn({ data: { token } });
        if (!cancelled) setUser(res.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    function onAuthChange() {
      setLoading(true);
      load();
    }

    function onStorage(e: StorageEvent) {
      if (!isSessionTokenStorageEvent(e)) return;
      onAuthChange();
    }

    window.addEventListener("cv-auth-change", onAuthChange);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("cv-auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
