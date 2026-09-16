import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/homepage/site-header";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#dff2ff] via-[#f4f9ff] to-white">
      <SiteHeader />
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-28 text-center sm:py-36">
        <p className="font-mono text-sm font-semibold tracking-[0.25em] text-sky-600">404</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">没有找到这个页面</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">这个国家不在第一版的八个经济体范围内，或者页面地址有误。</p>
        <Link href="/countries" className="mt-8 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-500">
          <ArrowLeft className="size-4" aria-hidden="true" />返回国家列表
        </Link>
      </section>
    </main>
  );
}
