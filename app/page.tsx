// app/page.tsx

import AuraClient from "@/components/AuraClient";
import { Sparkles } from "lucide-react";
import { Suspense } from 'react';

export default function Home() {
  return (
    // ダークモード対応の背景グラデーションを追加
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* ヘッダーセクション */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* アイコンの色を動的に調整 */}
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aura
              </h1>
            </div>
            {/* Shadcn/uiのクラス名に変更 */}
            <p className="text-xl text-foreground/80 font-medium">AI Text Detector</p>
            {/* Shadcn/uiのクラス名に変更 */}
            <p className="text-muted-foreground max-w-2xl mx-auto">
              文章がAIによって生成されたものか人間によって書かれたものかを高精度で判定します
            </p>
          </div>

          {/* 動的な部分はすべてこのクライアントコンポーネントに任せる */}
          <Suspense fallback={<p>Loading...</p>}>
            <AuraClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}