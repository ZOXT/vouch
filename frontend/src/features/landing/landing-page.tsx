import { Link, useNavigate } from "react-router-dom";
import {
  Quote,
  Link as LinkIcon,
  Brain,
  Code,
  Megaphone,
  Sparkles,
  Star,
  Play,
  ArrowRight,
  Check,
  ShieldCheck,
  Gauge,
  Captions,
  Mic,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavLink = { label: string; href: string } | { label: string; to: string };

const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Embeds", href: "#embeds" },
];

const FEATURES = [
  {
    icon: LinkIcon,
    title: "Collect with a Link",
    description:
      "Share one link and watch video testimonials roll in. Clients record or upload on any device, no account needed.",
  },
  {
    icon: Brain,
    title: "AI-Powered Processing",
    description:
      "Every video is transcribed, captioned, and analyzed automatically, so your testimonials are search-ready in minutes.",
  },
  {
    icon: Code,
    title: "Embed Anywhere",
    description:
      "Add a polished testimonial wall to your site with a two-line snippet. Fully styled and mobile-responsive.",
  },
  {
    icon: Megaphone,
    title: "Smart Campaigns",
    description:
      "Launch targeted collection campaigns by product or service, then track views and submissions over time.",
  },
];

const CAPABILITIES = [
  { icon: Captions, label: "Auto transcription & captions" },
  { icon: Mic, label: "Video + text testimonials" },
  { icon: Brain, label: "AI sentiment analysis" },
  { icon: Gauge, label: "Lightning-fast processing" },
  { icon: ShieldCheck, label: "Secure, private uploads" },
];

const STEPS = [
  {
    number: 1,
    title: "Create a Request",
    description:
      "Set up a testimonial request or campaign in seconds. Add guiding questions and personalize the experience.",
  },
  {
    number: 2,
    title: "Share & Collect",
    description:
      "Send one link to your clients. They record a short video or write text on any device, no signup needed.",
  },
  {
    number: 3,
    title: "Publish & Embed",
    description:
      "AI transcribes, captions, and analyzes each submission. Review, publish, and embed a beautiful wall on your site.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    description: "Perfect for getting started",
    features: [
      "5 testimonials",
      "1 campaign",
      "1 embed section",
      "AI transcription & analysis",
      "Email support",
    ],
    highlighted: false,
    cta: { label: "Get Started Free", to: "/register" },
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/month",
    description: "For turning happy customers into social proof",
    features: [
      "Unlimited testimonials",
      "Unlimited campaigns & embeds",
      "Full-text search",
      "Advanced AI insights & sentiment",
      "Remove Vouch branding",
      "Priority support",
    ],
    highlighted: true,
    cta: { label: "Go Pro", to: "/pricing" },
  },
];

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", to: "/pricing" },
    { label: "Embeds", href: "#embeds" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", to: "/privacy" },
    { label: "Terms", to: "/terms" },
    { label: "Refunds", to: "/refunds" },
  ],
} as const;

const SampleEmbed = () => (
  <div className="animate-grow-in relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-brand-900/10">
    {/* Browser chrome */}
    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
      <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-gray-400">
        your-website.com/testimonials
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
        Sample embed
      </span>
    </div>

    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
      {/* Featured video card */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-800 p-5 sm:col-span-2 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle 10rem at 100% 0%, rgb(255 255 255 / 0.12), transparent 70%)",
          }}
        />
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-0.5 fill-white text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-black/25 px-2 py-1 text-[10px] font-semibold text-white">
              <Captions className="h-3 w-3" /> CC
            </span>
            <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-semibold text-white">
              00:24
            </span>
          </div>
        </div>
        <div className="mt-8 space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-white/30" />
          <div className="h-2 w-2/3 rounded-full bg-white/20" />
          <div className="h-2 w-1/2 rounded-full bg-white/10" />
        </div>
        <p className="mt-4 text-sm font-medium text-white/80">
          Generated captions appear here as they speak.
        </p>
      </div>

      {/* Text cards */}
      {[
        { name: "A", initials: "AC", color: "bg-brand-100 text-brand-700" },
        { name: "B", initials: "MR", color: "bg-indigo-100 text-indigo-700" },
        { name: "C", initials: "EP", color: "bg-emerald-100 text-emerald-700" },
      ].map((card) => (
        <div key={card.name} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <div className="mb-2 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-gray-200" />
            <div className="h-2 w-11/12 rounded-full bg-gray-200" />
            <div className="h-2 w-4/6 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold", card.color)}>
              {card.initials}
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-16 rounded-full bg-gray-300" />
              <div className="h-1.5 w-12 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const signedIn = Boolean(user);
  const bootstrapping = user === undefined;

  const renderNavLink = (link: NavLink) =>
    "to" in link ? (
      <Link
        key={link.label}
        to={link.to}
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        {link.label}
      </Link>
    ) : (
      <a
        key={link.label}
        href={link.href}
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        {link.label}
      </a>
    );

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Quote className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900">
              Vouch
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(renderNavLink)}
          </div>

          <div className="flex items-center gap-3">
            {bootstrapping ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
            ) : signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    <Avatar
                      src={user!.avatar_url}
                      name={user!.name}
                      className="h-7 w-7 rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
                    />
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-normal">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {user!.company_name ?? user!.name}
                      </span>
                      <span className="block truncate text-xs font-normal text-gray-500">
                        {user!.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={handleLogout}
                      className="text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-indigo-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle 18rem at 0% 30%, rgb(199 210 254 / 0.5), transparent 70%), radial-gradient(circle 18rem at 100% 45%, rgb(165 180 252 / 0.45), transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
          <div className="animate-fade-in mx-auto max-w-4xl text-center">
            <div className="animate-grow-in mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              From one link to a library of proof
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Turn client praise into
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                your best marketing asset
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
              Vouch helps you collect, organize, search, and showcase authentic
              video testimonials. One link does the collecting. AI does the
              heavy lifting. Your website does the selling.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-7 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30"
              >
                Start collecting, it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-7 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Play className="h-4 w-4" />
                See how it works
              </a>
            </div>
          </div>

          <Reveal from="up" delay={150}>
            <SampleEmbed />
            <p className="animate-float mt-20 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Drop this on any page, it just works
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CAPABILITIES.map((item, index) => (
              <Reveal key={item.label} delay={index * 80} className={cn(index >= 4 && "sm:col-span-2 lg:col-span-1")}>
                <div className="flex h-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                  <item.icon className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="text-xs font-medium text-gray-600">{item.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="embeds"
        className="scroll-mt-20 border-y border-gray-100 bg-gray-50/50 py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
            Embed a live, searchable wall in two lines
          </p>
          <Reveal>
            <div className="mx-auto flex max-w-2xl flex-col items-stretch justify-center gap-3 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm sm:flex-row sm:items-center">
              <code className="whitespace-nowrap text-gray-800">
                &lt;script
                <span className="text-brand-600"> src=&quot;/embed.js&quot;</span>&gt;&lt;/script&gt;
              </code>
              <code className="whitespace-nowrap text-gray-400">{"→ customer sees your wall, in your theme"}</code>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-20 bg-white py-28 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Collect, organize, and showcase testimonials with AI-powered tools
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 90}>
                <div className="group h-full rounded-2xl border border-gray-200 bg-white p-8 shadow-card transition-all hover:-translate-y-1 hover:shadow-lifted">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100">
                    <feature.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 bg-gray-50/50 py-28 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              One link in. A library of proof out.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three steps between a shareable link and testimonial walls that
              sell for you while you sleep.
            </p>
          </div>

          <div className="relative mt-20">
            <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-brand-600/40 via-gray-200 to-transparent sm:left-1/2 sm:-translate-x-px" />

            <div className="space-y-12 sm:space-y-0">
              {STEPS.map((step, index) => {
                const right = index % 2 === 1;
                return (
                  <Reveal key={step.number} from={right ? "right" : "left"} delay={index * 120}>
                    <div
                      className={cn(
                        "relative flex items-start gap-8",
                        right && "sm:flex-row-reverse sm:text-right",
                      )}
                    >
                      <div
                        className={cn(
                          "relative z-10 flex w-full flex-row items-start gap-5 sm:w-1/2 sm:flex-col sm:gap-0",
                          right ? "sm:items-start sm:pl-12" : "sm:items-end sm:pr-12",
                        )}
                      >
                        <div className="animate-grow-in flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white shadow-lg shadow-brand-600/25">
                          {step.number}
                        </div>
                        <div className="min-w-0 flex-1 sm:mt-6">
                          <h3 className="font-display text-xl font-bold text-gray-900">
                            {step.title}
                          </h3>
                          <p className="mt-2 max-w-none leading-relaxed text-gray-600 sm:max-w-xs">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:block sm:w-1/2" />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="scroll-mt-20 bg-white py-28 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Upgrade when you&apos;re ready. Yearly billing = 2 months free.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
            {PLANS.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 90}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-white p-7",
                    plan.highlighted
                      ? "border-2 border-brand-600 shadow-lg shadow-brand-600/10 lg:-translate-y-2"
                      : "border-gray-200 shadow-card",
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-5xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-base text-gray-500">{plan.cadence}</span>
                  </div>
                  <ul className="mt-8 flex-1 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check
                          className={cn(
                            "mt-0.5 h-4.5 w-4.5 shrink-0",
                            plan.highlighted ? "text-brand-600" : "text-brand-500",
                          )}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.cta.to}
                    className={cn(
                      "mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                      plan.highlighted
                        ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {plan.cta.label}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Every paid plan is unlimited.{" "}
            <Link to="/pricing" className="font-medium text-brand-600 hover:text-brand-700">
              See yearly pricing
            </Link>
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-brand-600 to-brand-800 py-24 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle 16rem at 0% 100%, rgb(255 255 255 / 0.12), transparent 70%), radial-gradient(circle 16rem at 100% 0%, rgb(255 255 255 / 0.12), transparent 70%)",
          }}
        />

        <div className="animate-fade-in mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to make your clients your best salespeople?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-brand-100">
              Start free today and publish your first testimonial wall in under
              a day. No credit card required.
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl"
            >
              Start free, no credit card required
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                  <Quote className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-gray-900">
                  Vouch
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
                Collect, organize, and showcase client testimonials, all in one place.
              </p>
            </div>

            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-900">
                  {category}
                </h4>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {"to" in link ? (
                        <Link
                          to={link.to}
                          className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Vouch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};