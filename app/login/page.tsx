import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";

import { loginWithEmail, loginWithGoogle } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isGoogleLoginConfigured } from "@/lib/auth/google";
import { getSessionEmail } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const email = await getSessionEmail();
  if (email) redirect("/dashboard");

  const { error } = await searchParams;
  const googleLoginConfigured = isGoogleLoginConfigured();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center">
      <section className="w-full rounded-[8px] border border-[#2b2b2f] bg-black p-5">
        <h1 className="text-3xl font-bold">Log in</h1>
        <p className="mt-3 text-sm text-zinc-500">
          Continue with an allowed Google account or use the private email fallback.
        </p>

        {error && (
          <p className="mt-4 rounded-[6px] border border-[#7f1d1d] bg-[#210909] px-3 py-2 text-sm text-[#ff6b7a]">
            {error === "not-allowed"
              ? "This email is not in the allowlist."
              : error === "google-not-configured"
                ? "Google login is not configured yet."
                : "Enter a valid email address."}
          </p>
        )}

        <form action={loginWithGoogle} className="mt-6">
          <Button className="w-full" type="submit" disabled={!googleLoginConfigured}>
            <LogIn className="h-4 w-4" />
            {googleLoginConfigured ? "Continue with Google" : "Google login not configured"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-zinc-600">
          <span className="h-px flex-1 bg-[#202024]" />
          or
          <span className="h-px flex-1 bg-[#202024]" />
        </div>

        <form action={loginWithEmail} className="space-y-4">
          <Input name="email" type="email" placeholder="you@example.com" required />
          <Button className="w-full" type="submit" variant="subtle">
            Continue
          </Button>
        </form>
      </section>
    </div>
  );
}
