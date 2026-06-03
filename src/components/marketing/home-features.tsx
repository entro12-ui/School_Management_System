import { INTEGRATED_MODULES } from "@/lib/organization-hierarchy";

export function HomeFeatures() {
  return (
    <section id="features" className="scroll-mt-28 mt-16 sm:mt-20">
      <div className="text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Integrated modules
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          One record,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            every module
          </span>
        </h2>
        <p className="mt-2 text-slate-600">
          Academic, attendance, finance, library, analytics, and family communication
          share one student record, so teams work from the same truth instead of
          disconnected spreadsheets.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATED_MODULES.map((mod, i) => (
          <article
            key={mod.id}
            className={`rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-lg shadow-indigo-100/30 ${
              i === 0 ? "sm:col-span-2 lg:col-span-3 sm:flex sm:gap-8 sm:p-8" : ""
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
