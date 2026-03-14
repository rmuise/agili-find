import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center">
          <span className="text-[var(--black)] font-bold text-lg">AF</span>
        </div>
        <span className="text-2xl font-bold text-[var(--cream)]">AgiliFind</span>
      </Link>
      <SignupForm />
    </div>
  );
}
