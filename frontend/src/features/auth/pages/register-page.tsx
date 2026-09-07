import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";
import { PasswordStrengthChecklist } from "@/features/settings/components/password-strength";
import { authApi } from "../api";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "freelancer" as Role,
    company_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.company_name.trim() ? { company_name: form.company_name.trim() } : {}),
      });
      navigate("/verify-email", { state: { userId: user.id, email: form.email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-gray-500">Start collecting testimonials in minutes.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required minLength={2} maxLength={100} value={form.name} onChange={set("name")} placeholder="Sarah Kim" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={form.password} onChange={set("password")} placeholder="Create a strong password" />
          <PasswordStrengthChecklist password={form.password} />
        </div>
        <div>
          <Label htmlFor="role">I&apos;m a…</Label>
          <Select id="role" value={form.role} onChange={set("role")}>
            <option value="freelancer">Freelancer</option>
            <option value="agency">Agency</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="company">Company <span className="font-normal text-gray-400">(optional)</span></Label>
          <Input id="company" maxLength={100} value={form.company_name} onChange={set("company_name")} placeholder="Acme Corp" />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
};
