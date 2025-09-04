import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Sparkles, Home } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        {/* 成功アニメーション背景 */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-white animate-pulse" />
                <Sparkles className="w-6 h-6 text-white absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              登録完了！
            </h1>
            <p className="text-green-100">
              ありがとうございます
            </p>
          </div>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* プレミアム機能の説明 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-semibold text-slate-800">
                プレミアムプランが有効になりました
              </span>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-slate-700 text-sm leading-relaxed">
                より高精度な「Deepthink」分析をはじめ、
                <br />
                全ての機能をお楽しみいただけます。
              </p>
            </div>
          </div>

          {/* 利用可能機能リスト */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm">利用可能な機能:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                高精度AI判定アルゴリズム
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Deepthink詳細分析
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                無制限の判定回数
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                優先サポート
              </li>
            </ul>
          </div>

          {/* ホームに戻るボタン */}
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            size="lg"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              ホームに戻る
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}