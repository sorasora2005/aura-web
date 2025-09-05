import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw, HelpCircle, Clock } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        {/* キャンセル表示背景 */}
        <div className="relative bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <XCircle className="w-16 h-16 text-white animate-pulse" />
                <Clock className="w-6 h-6 text-white absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              決済がキャンセルされました
            </h1>
            <p className="text-red-100">
              プレミアム登録は完了していません
            </p>
          </div>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* キャンセルの説明 */}
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <p className="text-slate-700 text-sm leading-relaxed">
                決済処理が中断されました。
                <br />
                ご心配をおかけして申し訳ございません。
              </p>
            </div>
          </div>

          {/* 利用できない機能の説明 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm">現在の制限:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                基本判定のみ利用可能
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                Deepthink分析は制限あり
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                判定回数に制限あり
              </li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              size="lg"
            >
              <Link href="/pricing" className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                再度プレミアムに登録
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full border-slate-200 hover:bg-slate-50"
              size="lg"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          {/* サポート */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">
              ご不明な点がございましたら
            </p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800"
            >
              <Link href="/support" className="flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" />
                サポートにお問い合わせ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}