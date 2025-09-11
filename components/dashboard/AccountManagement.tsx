// components/dashboard/AccountManagement.tsx
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errorUtils";
import type { Session } from "@supabase/supabase-js";

type Props = {
  session: Session;
  profile: { plan: 'free' | 'premium', request_count: number };
};

export default function AccountManagement({ session, profile }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordReset = async () => {
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email!, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } else {
      setMessage({ type: 'success', text: 'パスワード再設定用のメールを送信しました。メールボックスをご確認ください。' });
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      const response = await fetch(`${baseUrl}/v1/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('アカウントの削除に失敗しました。');
      }

      // 成功したらログアウト処理を実行
      await supabase.auth.signOut();
      // ページがリロードされ、ログイン画面に戻る
      window.location.href = '/';

    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">アカウント管理</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 p-4 border rounded-lg">
          <p className="text-sm font-medium text-slate-600">メールアドレス</p>
          <p className="text-slate-800">{session.user.email}</p>
          <p className="text-xs text-slate-500">メールアドレスの変更は現在サポートされていません。</p>
        </div>

        <div className="space-y-2 p-4 border rounded-lg">
          <p className="text-sm font-medium text-slate-600">パスワード</p>
          <Button variant="outline" onClick={handlePasswordReset}>パスワードを変更</Button>
        </div>

        {/* Danger Zone */}
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-800">Danger Zone</h4>
          </div>
          <CardDescription className="text-red-700">
            この操作は取り消すことができません。アカウントと関連するすべてのデータが完全に削除されます。
          </CardDescription>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">アカウントを削除する</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当にアカウントを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-muted-foreground text-sm">
                    {profile.plan === 'premium' ? (
                      <div className="space-y-3">
                        <p className="font-bold text-red-600">
                          【プレミアムプランをご利用中のお客様へ】
                        </p>
                        <p>
                          アカウントを削除すると、プレミアムサービスは<strong>即座にご利用できなくなります。</strong>
                          あなたのアカウント、プロフィール、すべての判定履歴は永久に削除され、<strong>一切復旧できません。</strong>
                        </p>
                        <p>
                          また、現在ご契約中のサブスクリプションも解約されます。この操作は本当に元に戻せません。
                        </p>
                      </div>
                    ) : (
                      <p>
                        この操作を実行すると、あなたのアカウント、プロフィール、すべての判定履歴が永久に削除されます。この操作は元に戻せません。
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  削除を実行する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}