import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "全球经济数据对比网站",
  description: "查看和比较八个主要经济体的六项年度经济指标，关注数据口径、年份与来源。",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
