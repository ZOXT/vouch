import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { PasswordStrengthChecklist } from "@/features/settings/components/password-strength";
import { authApi } from "../api";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordsMatch = confirm === password;
  const canSubmit = password.length > 0 && passwordsMatch;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast.success("Password updated — you can now sign in");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="animate-fade-in text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invalid reset link</h1>
        <p className="mt-2 text-sm text-gray-500">
          This reset link is missing its token. Request a new one to continue.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-6 text-base font-medium text-white hover:bg-brand-700"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Password updated</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Your password was changed successfully. All existing sessions have been signed out.
        </p>
        <Link to="/login" className="mt-8 block">
          <Button className="w-full" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
        <KeyRound className="h-6 w-6 text-brand-600" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Set a new password</h1>
      <p className="mt-1.5 text-sm text-gray-500">Choose a strong password for your account.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <PasswordStrengthChecklist password={password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
          {confirm.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-red-600">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg" disabled={!canSubmit}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
};