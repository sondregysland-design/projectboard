"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoIcon } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 -ml-0 lg:-ml-64">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <LogoIcon className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">
            <span className="text-primary">ARGON</span>{" "}
            <span className="font-light text-text-light">Solutions</span>
          </h1>
          <p className="mt-1 text-sm text-text-light">
            Logg inn for å fortsette
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
              E-post
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              required
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
              Passord
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logger inn..." : "Logg inn"}
          </Button>
        </form>
      </div>
    </div>
  );
}
