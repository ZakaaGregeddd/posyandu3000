import { createClient } from "@/lib/supabase/client";

export type AuthUser = {
  id: string;
  email: string | null;
};

/**
 * Login dengan email + password langsung ke Supabase (browser client).
 * Melempar Error kalau gagal, supaya bisa ditangkap try/catch di komponen.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error("Email atau kata sandi salah");
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * Logout dari Supabase (browser client).
 */
export async function logoutUser(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Cek apakah ada sesi user yang aktif.
 * Mengembalikan null kalau belum login (bukan melempar error).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return { id: user.id, email: user.email ?? null };
}
