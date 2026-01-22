import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Tracker from "@/components/Tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MY DUMMY SHOP | デモECサイト",
  description: "マーケティングツール検証用のデモショップです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* 📍 自前実装のトラッカーのみを残します。
           外部スニペットによる自動ポップアップ配信は、
           解析結果との二重表示を防ぐために停止しました。
        */}
        <Tracker />
        
        <Header />
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t py-8 text-center text-sm text-gray-500 bg-gray-50">
          © 2026 MY DUMMY SHOP. For Demonstration Purposes Only.
        </footer>
      </body>
    </html>
  );
}