import { Outlet, Link } from "react-router-dom";
import { Quote } from "lucide-react";

export const AuthLayout = () => (
  <div className="flex min-h-screen">
    {/* Brand panel */}
    <div className="hidden w-[42%] flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 p-12 text-white lg:flex">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Quote className="h-5 w-5" />
        </span>
        Vouch
      </Link>
      <div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Testimonials that build trust and convert visitors.
        </h2>
        <p className="mt-4 max-w-md text-brand-100">
          Collect video testimonials with a simple link, polish them with
          AI-powered captions and insights, and embed them anywhere.
        </p>
      </div>
      <p className="text-sm text-brand-200">© {new Date().getFullYear()} Vouch · tryvouch.me</p>
    </div>

    {/* Form panel */}
    <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2 text-xl font-bold text-brand-600 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Quote className="h-5 w-5" />
          </span>
          Vouch
        </Link>
        <Outlet />
      </div>
    </div>
  </div>
);
