import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { authApi } from "../api";
import { useAuth } from "../auth-provider";

interface VerifyState {
  userId?: string;
  email?: string;
}

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const state = (location.state ?? {}) as VerifyState;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.userId) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Nothing to verify</h1>
        <p className="mt-2 text-sm text-gray-500">Register or sign in to receive a verification code.</p>
        <Button className="mt-6" onClick={() => navigate("/register")}>Go to register</Button>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.verifyEmail(state.userId!, otp);
      setUser(result.user);
      toast.success("Email verified, welcome to Vouch!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp(state.userId!);
      toast.success("A new code is on its way");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
        <MailCheck className="h-6 w-6 text-brand-600" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Check your inbox</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        We sent a 6-digit code{state.email ? ` to ${state.email}` : ""}. It expires in 10 minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl font-semibold tracking-[0.5em]"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg" disabled={otp.length !== 6}>
          Verify email
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
        <Link to="/login" className="text-gray-500 hover:text-gray-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
