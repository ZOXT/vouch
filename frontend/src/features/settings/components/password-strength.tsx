import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "lowercase", label: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "uppercase", label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "At least one number", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "At least one special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const PASSWORD_REQUIREMENTS = REQUIREMENTS;

export const PasswordStrengthChecklist = ({ password }: { password: string }) => {
  const metCount = REQUIREMENTS.filter((r) => r.test(password)).length;
  const allMet = metCount === REQUIREMENTS.length;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full transition-all duration-300",
            allMet ? "bg-green-500" : metCount <= 1 ? "bg-red-400" : metCount <= 3 ? "bg-amber-400" : "bg-green-400",
          )}
          style={{ width: `${(metCount / REQUIREMENTS.length) * 100}%` }}
        />
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.id}
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                met ? "text-green-600" : "text-gray-400",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] leading-none",
                  met ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400",
                )}
              >
                {met ? "✓" : ""}
              </span>
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};