"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import Detector from "@/components/Detector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, Crown, Sparkles } from "lucide-react";

// ユーザープロファイルの型を定義
type UserProfile = {
  plan: 'free' | 'premium';
  request_count: number;
};

// 決済セッション作成をリクエストする関数
const createCheckoutSession = async (accessToken: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
  if (!baseUrl) {
    throw new Error("APIエンドポイントが設定されていません。");
  }
  const endpoint = `${baseUrl}/v1/payments/create-checkout-session`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "決済ページの作成に失敗しました。");
  }

  const data = await response.json();
  return data.url;
};

export default function Home() {
  // Supabaseクライアントのインスタンスを作成
  const supabase = createClient();

  // ユーザーのセッション情報を保存するためのState
  const [session, setSession] = useState<Session | null>(null);
  // 認証状態の読み込みを管理
  const [loading, setLoading] = useState(true);

  // 追加のState
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // コンポーネントがマウントされた時に一度だけ実行
  useEffect(() => {
    // 現在のセッションとプロファイル情報を取得する非同期関数
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // ログインしている場合、プロフィール情報を取得
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan, request_count')
          .single();
        setProfile(profileData as UserProfile);
      }

      setLoading(false);
    };

    getSessionAndProfile();

    // 認証状態（ログイン、ログアウトなど）が変化したときに発火するイベントリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // 認証状態が変わったらプロフィールも再取得
        if (session) {
          const getProfile = async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('plan, request_count')
              .single();
            setProfile(profileData as UserProfile);
          };
          getProfile();
        } else {
          setProfile(null);
        }
      }
    );

    // コンポーネントがアンマウントされるときにイベントリスナーを解除
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ページをリロードして状態をリセット
    window.location.reload();
  };

  // アップグレード処理
  const handleUpgradeClick = async () => {
    if (!session) return;
    setIsRedirecting(true);
    setPaymentError(null);
    try {
      const checkoutUrl = await createCheckoutSession(session.access_token);
      // Stripeの決済ページへリダイレクト
      window.location.href = checkoutUrl;
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "不明なエラーが発生しました。");
      setIsRedirecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* ヘッダーセクション */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aura
              </h1>
            </div>
            <p className="text-xl text-slate-600 font-medium">AI Text Detector</p>
            <p className="text-slate-500 max-w-2xl mx-auto">
              文章がAIによって生成されたものか人間によって書かれたものかを高精度で判定します
            </p>
          </div>

          {/* 認証状態を読み込み中 */}
          {loading ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">読み込み中...</span>
              </CardContent>
            </Card>
          ) : !session ? (
            // 未ログイン時の認証UI
            <Card className="max-w-md mx-auto shadow-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">ログイン</CardTitle>
                <CardDescription>
                  アカウントにログインして AI 判定機能をご利用ください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    style: {
                      button: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      },
                      input: {
                        borderRadius: '8px',
                        fontSize: '14px'
                      }
                    }
                  }}
                  providers={['google']}
                  localization={{
                    variables: {
                      sign_in: {
                        email_label: 'メールアドレス',
                        password_label: 'パスワード',
                        email_input_placeholder: 'your@email.com',
                        password_input_placeholder: '********',
                        button_label: 'サインイン',
                        social_provider_text: '{{provider}}でサインイン',
                        link_text: 'アカウントをお持ちですか？ サインイン',
                      },
                      sign_up: {
                        email_label: 'メールアドレス',
                        password_label: 'パスワード',
                        email_input_placeholder: 'your@email.com',
                        password_input_placeholder: '********',
                        button_label: 'サインアップ',
                        social_provider_text: '{{provider}}でサインアップ',
                        link_text: 'アカウントがありませんか？ サインアップ',
                      },
                      forgotten_password: {
                        email_label: 'メールアドレス',
                        button_label: 'パスワードをリセット',
                        link_text: 'パスワードをお忘れですか？',
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            // ログイン済みの場合
            <>
              {/* ユーザー情報ヘッダー */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      {session.user.email}
                    </p>
                    <p className="text-sm text-slate-500">ようこそお帰りなさい</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {profile && (
                    <Badge
                      variant={profile.plan === 'premium' ? 'default' : 'secondary'}
                      className={profile.plan === 'premium'
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0'
                        : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {profile.plan === 'premium' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM
                        </>
                      ) : (
                        'FREE'
                      )}
                    </Badge>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ログアウト
                  </Button>
                </div>
              </div>

              {/* プレミアムアップグレードセクション */}
              {profile?.plan === 'free' && (
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      プレミアムプランにアップグレード
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                      より高精度な「Deepthink」分析など、全ての機能を利用できます。
                      プロフェッショナルな文章判定をお試しください。
                    </p>
                    <Button
                      onClick={handleUpgradeClick}
                      disabled={isRedirecting}
                      size="lg"
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 shadow-lg"
                    >
                      {isRedirecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          処理中...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          プレミアムに登録する
                        </>
                      )}
                    </Button>
                    {paymentError && (
                      <Alert className="mt-4 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {paymentError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI判定コンポーネント */}
              <Detector session={session} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}