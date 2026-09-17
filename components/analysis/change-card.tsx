import type { ReactNode } from "react";

export function ChangeCard({ eyebrow, title, value, detail, icon }: { eyebrow: string; title: string; value: string; detail: string; icon?: ReactNode }) {
  return (
    <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_45px_-38px_rgba(2,132,199,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">{eyebrow}</p><h3 className="mt-2 text-sm font-semibold text-slate-800">{title}</h3></div>
        {icon ? <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">{icon}</span> : null}
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
