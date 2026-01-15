import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Tracker from "@/components/Tracker";
import Script from "next/script"; // Next.jsのScriptコンポーネントをインポート

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
        {/* 自前で実装したトラッカー（ページ遷移の監視など） */}
        <Tracker />

        {/* マーケティングツールのスニペット配信APIを読み込み
          - uid: 管理者ID（demo_user_123）を指定
          - strategy: afterInteractive（ページ読み込み後に実行）
        */}
        <Script 
          src="http://localhost:3001/api/v1/snippet?uid=demo_user_123" 
          strategy="afterInteractive"
        />
        
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