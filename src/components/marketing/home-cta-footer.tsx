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
    <footer id="contact" className="mt-16 pb-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-1 shadow-2xl shadow-indigo-200/50">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl" />

        <div className="relative rounded-[1.8rem] bg-white/95 p-6 backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-cyan-50/40 p-6 shadow-lg shadow-indigo-100/40">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-300/50">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900">EduSync SMS</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    SchoolHub by Entro Ethiopia
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                A professional KG-12 school management platform for multi-branch schools,
                connecting academics, finance, library, HR, parents, students, teachers,
                and AI-supported insights in one secure operating system.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Multi-branch ready", "AI-supported", "Role-based portals"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-indigo-100 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-indigo-200">
                <MapPin className="h-3.5 w-3.5" />
                Locally engineered in Ethiopia
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="flex flex-col gap-6 sm:flex-row sm:justify-between lg:flex-col">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Quick access
                  </h3>
                  <div className="mt-4 grid gap-2 text-sm">
                    <Link href="/login" className="font-semibold text-slate-600 hover:text-indigo-600">
                      Sign in
                    </Link>
                    <Link href="/register" className="font-semibold text-slate-600 hover:text-indigo-600">
                      Register staff
                    </Link>
                    <a href="#portals" className="font-semibold text-slate-600 hover:text-indigo-600">
                      Role portals
                    </a>
                    <a href="#features" className="font-semibold text-slate-600 hover:text-indigo-600">
                      Platform modules
                    </a>
                  </div>
                </div>

                <details className="group">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-700/25 transition hover:from-slate-900 hover:to-indigo-800 [&::-webkit-details-marker]:hidden">
                    Contact Us
                    <ArrowRight className="h-4 w-4 transition group-open:rotate-90" />
                  </summary>

                  <div className="mt-4 space-y-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3">
                    {CONTACT_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                          className="group/contact flex items-center gap-3 rounded-xl border border-white bg-white p-3 text-sm shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover/contact:bg-indigo-100">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                              {item.label}
                            </span>
                            <span className="font-semibold text-slate-800 group-hover/contact:text-indigo-700">
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
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-indigo-100/80 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} EduSync SMS. All rights reserved.</p>
            <p>
              Built by{" "}
              <a
                href="https://www.entroethiopia.com/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-indigo-600 hover:underline"
              >
                Entro Ethiopia Software Development PLC
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
