import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Camera, Globe, KeyRound, Loader2, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint, FieldError } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/features/auth/auth-provider";
import { PasswordStrengthChecklist } from "../components/password-strength";
import { settingsApi } from "../api";
import { uploadToS3, formatBytes } from "@/lib/upload";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    company_name: user?.company_name ?? "",
    company_url: user?.company_url ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  if (!user) return null;

  const refreshUser = async () => {
    const updated = await settingsApi.getMe();
    setUser(updated);
  };

  const onProfileChange =
    (key: keyof typeof profile) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setProfile((prev) => ({ ...prev, [key]: e.target.value }));

  const onProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await settingsApi.updateProfile({
        name: profile.name.trim(),
        company_name: profile.company_name.trim() || null,
        company_url: profile.company_url.trim() || null,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update profile";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onLogoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError(`Image must be under ${formatBytes(MAX_LOGO_SIZE)}.`);
      return;
    }

    setLogoError(null);
    setUploadingLogo(true);
    setUploadProgress(0);
    try {
      const { url, key } = await settingsApi.getAvatarUploadUrl(file.type);
      await uploadToS3(url, file, file.type, setUploadProgress);
      await settingsApi.confirmAvatarUpload(key);
      await refreshUser();
      toast.success("Logo updated");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to upload logo";
      setLogoError(message);
      toast.error(message);
    } finally {
setUploadingLogo(false);
    setUploadProgress(null);
    }
  };

  const onPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPw(true);
    setPwError(null);
    try {
      if (pw.next !== pw.confirm) {
        setPwError("New passwords do not match.");
        return;
      }
      await settingsApi.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to change password";
      setPwError(message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, company details, logo, and security."
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              Profile & company
            </CardTitle>
            <CardDescription>
              Shown on your public embeds, request pages, and campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onProfileSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={profile.name}
                  onChange={onProfileChange("name")}
                  placeholder="Sarah Kim"
                />
              </div>
              <div>
                <Label htmlFor="company_name">Company name</Label>
                <Input
                  id="company_name"
                  maxLength={100}
                  value={profile.company_name}
                  onChange={onProfileChange("company_name")}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="company_url">Company website</Label>
                <Input
                  id="company_url"
                  type="url"
                  maxLength={300}
                  value={profile.company_url}
                  onChange={onProfileChange("company_url")}
                  placeholder="https://acme.com"
                />
                <FieldHint>Optional. Used on public pages.</FieldHint>
              </div>

              {profileError && <FieldError message={profileError} />}

              <Button type="submit" loading={savingProfile}>
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-400" />
              Company logo
            </CardTitle>
            <CardDescription>
              Used as the logo on your public request and campaign pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-base font-semibold text-brand-700">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Company logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile.company_name.trim() || user.name).split(" ").map((p) => p[0]).join("").slice(0, 2)
              )}
            </span>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={onLogoSelected}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                {uploadingLogo
                  ? uploadProgress !== null
                    ? `Uploading ${Math.round(uploadProgress * 100)}%`
                    : "Uploading…"
                  : user.avatar_url
                    ? "Replace logo"
                    : "Upload logo"}
              </Button>
              <FieldHint>JPG, PNG, or WebP up to {formatBytes(MAX_LOGO_SIZE)}.</FieldHint>
              {logoError && <FieldError message={logoError} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-400" />
              Password
            </CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters, upper and lowercase
              letters, a number, and a special character.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPasswordSubmit} className="space-y-5">
              <div>
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={pw.current}
                  onChange={(e) => setPw((prev) => ({ ...prev, current: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="next">New password</Label>
                <Input
                  id="next"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={pw.next}
                  onChange={(e) => setPw((prev) => ({ ...prev, next: e.target.value }))}
                  placeholder="At least 8 characters"
                  minLength={8}
                  maxLength={128}
                />
                <PasswordStrengthChecklist password={pw.next} />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={pw.confirm}
                  onChange={(e) => setPw((prev) => ({ ...prev, confirm: e.target.value }))}
                />
                {pw.confirm && pw.next !== pw.confirm && (
                  <FieldError message="Passwords do not match." />
                )}
              </div>

              {pwError && <FieldError message={pwError} />}

              <Button type="submit" loading={savingPw}>
                Change password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};