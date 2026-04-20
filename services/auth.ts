import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export type AuthResult = { user: User; session: Session };

function mapAuthError(message: string): string {
  if (/invalid login/i.test(message)) return "E-Mail oder Passwort falsch.";
  if (/already registered/i.test(message)) return "Diese E-Mail ist bereits registriert.";
  if (/weak password|at least/i.test(message)) return "Passwort ist zu schwach (min. 8 Zeichen).";
  if (/rate limit/i.test(message)) return "Zu viele Versuche. Probier es gleich nochmal.";
  return message;
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw new Error(mapAuthError(error.message));
  if (!data.user || !data.session) {
    throw new Error("Bitte bestätige deine E-Mail, bevor du dich einloggst.");
  }
  return { user: data.user, session: data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(mapAuthError(error.message));
  return { user: data.user!, session: data.session! };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(mapAuthError(error.message));
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw new Error(mapAuthError(error.message));
}
