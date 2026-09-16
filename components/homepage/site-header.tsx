import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3 text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-100 font-serif text-lg font-bold text-sky-700">经</span>
          <span className="hidden text-sm font-semibold tracking-wide sm:inline">全球经济数据</span>
        </Link>
        <nav aria-label="主要导航" className="flex items-center gap-3 text-xs text-slate-500 sm:gap-8 sm:text-sm">
          <Link className="transition hover:text-sky-700" href="/">首页</Link>
          <Link className="transition hover:text-sky-700" href="/countries">国家</Link>
          <Link className="transition hover:text-sky-700" href="/compare">对比</Link>
          <Link className="transition hover:text-sky-700" href="/rankings">排名</Link>
        </nav>
      </div>
    </header>
  );
}
