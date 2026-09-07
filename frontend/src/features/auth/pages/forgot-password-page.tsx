import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { authApi } from "../api";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
          <MailQuestion className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Check your inbox</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          If an account exists for <span className="font-medium text-gray-700">{email}</span>, we
          sent a link to reset your password. It expires in 60 minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button className="w-full" size="lg" onClick={() => setSent(false)}>
            Send another link
          </Button>
          <Link
            to="/login"
            className="text-center text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
        <MailQuestion className="h-6 w-6 text-brand-600" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
};