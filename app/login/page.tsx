import { redirect } from "next/navigation";

import { loginWithEmail } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionEmail } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const email = await getSessionEmail();
  if (email) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center">
      <section className="w-full rounded-[8px] border border-[#2b2b2f] bg-black p-5">
        <h1 className="text-3xl font-bold">Log in</h1>
        <p className="mt-3 text-sm text-zinc-500">
          Temporary email gate for private staging. Magic-link or Google login can replace this
          once provider credentials are available.
        </p>

        {error && (
          <p className="mt-4 rounded-[6px] border border-[#7f1d1d] bg-[#210909] px-3 py-2 text-sm text-[#ff6b7a]">
            {error === "not-allowed"
              ? "This email is not in the allowlist."
              : "Enter a valid email address."}
          </p>
        )}

        <form action={loginWithEmail} className="mt-6 space-y-4">
          <Input name="email" type="email" placeholder="you@example.com" required />
          <Button className="w-full" type="submit">
            Continue
          </Button>
        </form>
      </section>
    </div>
  );
}
