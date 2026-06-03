import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_LINKS = [
  {
    label: "Website",
    value: "www.entroethiopia.com",
    href: "https://www.entroethiopia.com/",
    icon: ExternalLink,
  },
  {
    label: "Phone",
    value: "+251 976 113 638",
    href: "tel:+251976113638",
    icon: Phone,
  },
  {
    label: "Email",
    value: "entro12@entroethiopia.com",
    href: "mailto:entro12@entroethiopia.com",
    icon: Mail,
  },
] as const;

export function HomeCta({ dashboardHref }: { dashboardHref: string }) {
  return (
    <section className="relative mt-16 overflow-hidden rounded-3xl sm:mt-20">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIuMDgiLz48L2c+PC9zdmc+')] opacity-60" />
      <div className="relative flex flex-col gap-6 p-8 text-white sm:p-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-100">
            Ready to modernize school operations?
          </p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Give every role a clearer way to work
          </h2>
          <p className="mt-3 text-indigo-100 leading-relaxed">
            Explore the connected experience: leadership dashboards, teacher workflows,
            family portals, finance records, library operations, HR, and student analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/login">
            <Button
              size="lg"
              className="rounded-xl bg-white font-semibold text-indigo-700 shadow-xl hover:bg-indigo-50"
            >
              Sign in now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={dashboardHref}>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white/50 bg-white/10 text-white hover:bg-white/20"
            >
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  return (
    <footer id="contact" className="mt-14 border-t border-indigo-100/80 pt-10 pb-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">EduSync SMS</p>
              <p className="text-xs text-slate-500">Powered by Entro Ethiopia</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            A professional KG-12 school management platform for multi-branch schools,
            connecting academics, finance, library, HR, parents, students, teachers,
            and AI-supported insights in one system.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <MapPin className="h-3.5 w-3.5" />
            Locally engineered in Ethiopia
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            Quick access
          </h3>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/login" className="font-medium text-slate-600 hover:text-indigo-600">
              Sign in
            </Link>
            <Link href="/register" className="font-medium text-slate-600 hover:text-indigo-600">
              Register staff
            </Link>
            <a href="#portals" className="font-medium text-slate-600 hover:text-indigo-600">
              Role portals
            </a>
            <a href="#features" className="font-medium text-slate-600 hover:text-indigo-600">
              Platform features
            </a>
          </div>
          <details className="group mt-5">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:from-slate-950 hover:to-indigo-800 [&::-webkit-details-marker]:hidden">
              Contact Us
              <ArrowRight className="h-4 w-4 transition group-open:rotate-90" />
            </summary>

            <div className="mt-4 space-y-3 rounded-2xl border border-indigo-100 bg-white/85 p-3 shadow-lg shadow-indigo-100/50">
              {CONTACT_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group/contact flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm transition hover:border-indigo-200 hover:bg-indigo-50/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover/contact:bg-indigo-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </span>
                      <span className="font-medium text-slate-800 group-hover/contact:text-indigo-700">
                        {item.value}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-indigo-100/80 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} EduSync SMS. All rights reserved.</p>
        <p>
          Built by{" "}
          <a
            href="https://www.entroethiopia.com/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Entro Ethiopia Software Development PLC
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
