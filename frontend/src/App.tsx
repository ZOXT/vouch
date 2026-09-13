import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/auth-provider";
import { AuthLayout } from "@/features/auth/auth-layout";
import { GuestRoute, ProtectedRoute } from "@/features/auth/protected-route";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { VerifyEmailPage } from "@/features/auth/pages/verify-email-page";
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";
import { AppLayout } from "@/layouts/app-layout";
import { FullPageSpinner } from "@/components/ui/spinner";
import { canonicalHostRedirect } from "@/lib/host";

// Lazy-load the heavier dashboard areas for a fast initial bundle.
const OverviewPage = lazy(() =>
  import("@/features/dashboard/overview-page").then((m) => ({ default: m.OverviewPage })),
);
const TestimonialsPage = lazy(() =>
  import("@/features/testimonials/pages/testimonials-page").then((m) => ({ default: m.TestimonialsPage })),
);
const TestimonialDetailPage = lazy(() =>
  import("@/features/testimonials/pages/testimonial-detail-page").then((m) => ({ default: m.TestimonialDetailPage })),
);
const RequestsPage = lazy(() =>
  import("@/features/requests/pages/requests-page").then((m) => ({ default: m.RequestsPage })),
);
const CampaignsPage = lazy(() =>
  import("@/features/campaigns/pages/campaigns-page").then((m) => ({ default: m.CampaignsPage })),
);
const CampaignFormPage = lazy(() =>
  import("@/features/campaigns/pages/campaign-form-page").then((m) => ({ default: m.CampaignFormPage })),
);
const EmbedsPage = lazy(() =>
  import("@/features/embeds/pages/embeds-page").then((m) => ({ default: m.EmbedsPage })),
);
const EmbedEditorPage = lazy(() =>
  import("@/features/embeds/pages/embed-editor-page").then((m) => ({ default: m.EmbedEditorPage })),
);
const RequestSubmitPage = lazy(() =>
  import("@/features/submission/pages/request-submit-page").then((m) => ({ default: m.RequestSubmitPage })),
);
const CampaignSubmitPage = lazy(() =>
  import("@/features/submission/pages/campaign-submit-page").then((m) => ({ default: m.CampaignSubmitPage })),
);
const SearchPage = lazy(() =>
  import("@/features/search/pages/search-page").then((m) => ({ default: m.SearchPage })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/settings-page").then((m) => ({ default: m.SettingsPage })),
);
const LandingPage = lazy(() =>
  import("@/features/landing/landing-page").then((m) => ({ default: m.LandingPage })),
);
const PricingPage = lazy(() =>
  import("@/features/billing/pages/pricing-page").then((m) => ({ default: m.PricingPage })),
);
const WelcomePage = lazy(() =>
  import("@/features/billing/pages/welcome-page").then((m) => ({ default: m.WelcomePage })),
);
const PrivacyPage = lazy(() =>
  import("@/features/legal/privacy-page").then((m) => ({ default: m.PrivacyPage })),
);

const router = createBrowserRouter([
  // Landing page (public, accessible to all)
  {
    path: "/",
    element: <Lazy><LandingPage /></Lazy>,
  },
  { path: "/pricing", element: <Lazy><PricingPage /></Lazy> },
  { path: "/privacy", element: <Lazy><PrivacyPage /></Lazy> },
  { path: "/welcome", element: <Lazy><WelcomePage /></Lazy> },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/verify-email", element: <VerifyEmailPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  // Public client-facing submission pages (no auth, no dashboard chrome)
  { path: "/:slug/r/:token", element: <RequestSubmitPage /> },
  { path: "/c/:slug", element: <CampaignSubmitPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Lazy><OverviewPage /></Lazy> },
          { path: "/testimonials", element: <Lazy><TestimonialsPage /></Lazy> },
          { path: "/testimonials/:id", element: <Lazy><TestimonialDetailPage /></Lazy> },
          { path: "/search", element: <Lazy><SearchPage /></Lazy> },
          { path: "/requests", element: <Lazy><RequestsPage /></Lazy> },
          { path: "/campaigns", element: <Lazy><CampaignsPage /></Lazy> },
          { path: "/campaigns/new", element: <Lazy><CampaignFormPage /></Lazy> },
          { path: "/campaigns/:id", element: <Lazy><CampaignFormPage /></Lazy> },
          { path: "/embeds", element: <Lazy><EmbedsPage /></Lazy> },
          { path: "/embeds/new", element: <Lazy><EmbedEditorPage /></Lazy> },
          { path: "/embeds/:id", element: <Lazy><EmbedEditorPage /></Lazy> },
          { path: "/settings", element: <Lazy><SettingsPage /></Lazy> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullPageSpinner />}>{children}</Suspense>;
}

export const App = () => {
  // The dominant and app subdomain both serve this same bundle. Redirect the
  // browser to the canonical host for the route (marketing apex vs app.*).
  const redirect = canonicalHostRedirect();
  if (redirect) {
    window.location.replace(redirect);
    return <FullPageSpinner />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </AuthProvider>
  );
};
