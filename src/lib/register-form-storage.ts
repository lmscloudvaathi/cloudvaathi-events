const STORAGE_PREFIX = "cv_reg_draft_v1";

export type RegisterFormDraft = {
  name: string;
  email: string;
  phone: string;
  org: string;
};

export function registerFormStorageKey(userId: number, slug: string): string {
  return `${STORAGE_PREFIX}:${userId}:${slug}`;
}

export function loadRegisterFormDraft(userId: number, slug: string): RegisterFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(registerFormStorageKey(userId, slug));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<RegisterFormDraft>;
    return {
      name: typeof p.name === "string" ? p.name : "",
      email: typeof p.email === "string" ? p.email : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      org: typeof p.org === "string" ? p.org : "",
    };
  } catch {
    return null;
  }
}

export function saveRegisterFormDraft(userId: number, slug: string, data: RegisterFormDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(registerFormStorageKey(userId, slug), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}
