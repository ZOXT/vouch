import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { authApi } from "../api";
import { useAuth } from "../auth-provider";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      if ("requiresVerification" in result && result.requiresVerification) {
        navigate("/verify-email", { state: { userId: result.userId, email } });
        return;
      }
      const user = (result as { user: User }).user;
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-gray-500">Sign in to your Vouch account.</p>

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
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  );
};
