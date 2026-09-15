export function SiteHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="#top" className="flex items-center gap-3 text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-400 font-serif text-lg font-bold text-emerald-950">经</span>
          <span className="text-sm font-semibold tracking-wide">全球经济数据</span>
        </a>
        <nav aria-label="首页内容" className="flex items-center gap-5 text-xs text-emerald-50/70 sm:gap-8 sm:text-sm">
          <a className="transition hover:text-white" href="#overview">经济概览</a>
          <a className="transition hover:text-white" href="#ranking">GDP 排名</a>
          <a className="hidden transition hover:text-white sm:inline" href="#about-data">数据说明</a>
        </nav>
      </div>
    </header>
  );
}
