// components/dashboard/PlanAndBilling.tsx
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Crown, CreditCard, Loader2, CalendarClock, ExternalLink } from "lucide-react";
import { getErrorMessage } from '@/lib/errorUtils';
import type { Session } from "@supabase/supabase-js";
import { format } from 'date-fns'; // date-fnsからformat関数をインポート
import { ja } from 'date-fns/locale'; // 日本語ロケールをインポート

type Props = {
  session: Session;
  profile: {
    plan: 'free' | 'premium',
    stripe_customer_id?: string,
    plan_expires_at?: string | null
  };
};

export default function PlanAndBilling({ session, profile }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '操作に失敗しました。');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleUpgrade = () => handleApiCall('/v1/payments/create-checkout-session');
  const handleManageBilling = () => handleApiCall('/v1/payments/create-portal-session');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">プランと請求</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        {profile.plan === 'free' ? (
          <div className="p-6 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center space-y-4">
            <div className="flex justify-center">
              <Badge variant="secondary">FREE プラン</Badge>
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              プレミアムにアップグレード
            </h3>
            <ul className="text-sm text-slate-600 list-disc list-inside text-left mx-auto max-w-xs space-y-1">
              <li>リクエスト上限の増加 (1000回)</li>
              <li>高精度な分析モデルの利用</li>
              <li>今後の新機能への優先アクセス</li>
            </ul>
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
              アップグレードする
            </Button>
          </div>
        ) : (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-700">現在のプラン</p>
              <Badge className='bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0'>
                <Crown className="w-3 h-3 mr-1" />
                PREMIUM
              </Badge>
            </div>
            {/* plan_expires_at が存在する場合の表示 */}
            {profile.plan_expires_at && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <CalendarClock className="h-4 w-4" />
                <AlertTitle>プラン変更の予定</AlertTitle>
                <AlertDescription>
                  現在のプレミアムプランは **{format(new Date(profile.plan_expires_at), 'yyyy年M月d日', { locale: ja })}** まで有効です。
                  それ以降はフリープランに移行します。
                </AlertDescription>
              </Alert>
            )}
            <div className="pt-4 border-t">
              <p className="text-sm text-slate-600 mb-2">支払い方法の変更や請求履歴の確認は、Stripeのカスタマーポータルで行うことができます。</p>
              <Button
                onClick={handleManageBilling}
                disabled={loading || !profile.stripe_customer_id}
                variant="outline"
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                請求情報を管理する
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}