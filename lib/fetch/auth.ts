export type AuthUser = {
  id: string;
  email: string | null;
};

const isClient = typeof window !== "undefined";

/**
 * Login offline (tanpa Supabase). Menyimpan sesi ke localStorage.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!email || !password) {
    throw new Error("Email/username dan kata sandi wajib diisi");
  }

  // Izinkan login offline dengan user kader default
  const user: AuthUser = {
    id: "offline-kader-id",
    email: email.includes("@") ? email : `${email}@posyandu.com`,
  };

  if (isClient) {
    localStorage.setItem("offline_user", JSON.stringify(user));
  }

  return user;
}

/**
 * Logout offline dengan menghapus data sesi di localStorage.
 */
export async function logoutUser(): Promise<void> {
  if (isClient) {
    localStorage.removeItem("offline_user");
  }
}

/**
 * Cek sesi user aktif di localStorage.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isClient) {
    const stored = localStorage.getItem("offline_user");
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}
