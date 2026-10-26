"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(_prev: { error: string }, formData: FormData) {
  try {
    await signIn("credentials", { password: String(formData.get("password") ?? ""), redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: error.type === "CredentialsSignin" ? "Kata sandi salah." : "Gagal masuk. Coba lagi.",
      };
    }
    throw error;
  }
  redirect("/");
}
