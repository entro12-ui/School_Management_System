import { INTEGRATED_MODULES } from "@/lib/organization-hierarchy";

export function HomeFeatures() {
  return (
    <section id="features" className="scroll-mt-28 mt-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Integrated modules
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Everything branches need day to day
        </h2>
        <p className="mt-2 text-slate-600">
          Academic, attendance, finance, and library share one student record — no
          duplicate data entry.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {INTEGRATED_MODULES.map((mod, i) => (
          <article
            key={mod.id}
            className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
              i === 0 ? "sm:col-span-2 sm:flex sm:gap-8 sm:p-8" : ""
            }`}
          >
            <div className={i === 0 ? "sm:flex-1" : ""}>
              <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{mod.description}</p>
              <ul className={`mt-4 space-y-2 ${i === 0 ? "sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0" : ""}`}>
                {mod.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
