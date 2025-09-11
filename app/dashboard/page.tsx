// app/dashboard/page.tsx

import DashboardClient from "@/components/dashboard/DashboardClient";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* ヘッダーセクション */}
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              メインページに戻る
            </Link>
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                ダッシュボード
              </h1>
            </div>
            <p className="text-muted-foreground">
              あなたのアカウント情報と利用状況の概要です。
            </p>
          </div>

          {/* 動的な部分はすべてこのクライアントコンポーネントに任せる */}
          <DashboardClient />
        </div>
      </div>
    </main>
  );
}