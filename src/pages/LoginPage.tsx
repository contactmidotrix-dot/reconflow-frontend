import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/upload");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
            ReconFlow<span className="text-copper">.</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Find what the platforms didn't pay you.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper-raised p-8 shadow-[0_1px_2px_rgba(33,29,24,0.04),0_8px_24px_rgba(33,29,24,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-copper focus:ring-2 focus:ring-copper/20"
                placeholder="you@restaurant.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-copper focus:ring-2 focus:ring-copper/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-severity-critical/20 bg-severity-critical/5 px-3.5 py-2.5 text-sm text-severity-critical"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-copper px-4 py-2.5 text-sm font-medium text-paper-raised transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          ReconFlow AI — delivery-platform reconciliation
        </p>
      </div>
    </div>
  );
}
