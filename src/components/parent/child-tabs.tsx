import Link from "next/link";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  gradeLabel: string;
  className: string;
};

export function ChildTabs({
  linkedChildren,
  activeChildId,
  basePath,
}: {
  linkedChildren: Child[];
  activeChildId: string;
  basePath: string;
}) {
  if (linkedChildren.length <= 1) {
    const child = linkedChildren[0];
    if (!child) return null;
    return (
      <p className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        Viewing: <strong>{child.firstName} {child.lastName}</strong> · {child.gradeLabel} ·{" "}
        {child.className}
      </p>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {linkedChildren.map((child) => {
        const active = child.id === activeChildId;
        return (
          <Link
            key={child.id}
            href={`${basePath}?childId=${child.id}`}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
            }`}
          >
            {child.firstName} {child.lastName}
            <span className={`ml-1 text-xs ${active ? "text-indigo-100" : "text-slate-400"}`}>
              {child.gradeLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
