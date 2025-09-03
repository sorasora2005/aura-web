"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import Detector from "@/components/Detector";

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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-gray-50 text-gray-800">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Aura: AI Text Detector
          </h1>
          <p className="text-gray-600 mt-2">
            文章がAIによって生成されたものか人間によって書かれたものかを判定します。
          </p>
        </header>

        {/* 認証状態を読み込み中は何も表示しない */}
        {loading ? (
          <p className="text-center">読み込み中...</p>
        ) : !session ? (
          // セッションがない（未ログイン）場合は、Supabaseの認証UIを表示
          <div className="p-8 bg-white rounded-lg shadow-lg border border-gray-200">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']} // Googleログインを有効化
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
          </div>
        ) : (
          // セッションがある（ログイン済み）場合は、AI判定コンポーネントとログアウトボタンを表示
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600">
                ようこそ, {session.user.email}
              </p>
              <div className="flex items-center gap-4">
                {profile && (
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${profile.plan === 'premium'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-gray-200 text-gray-800'
                    }`}>
                    {profile.plan.toUpperCase()} プラン
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-red-600 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>

            {/* プレミアムアップグレード促進セクション */}
            {profile?.plan === 'free' && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <h3 className="text-xl font-bold text-blue-800">プレミアムプランにアップグレード</h3>
                <p className="text-gray-600 mt-2 mb-4">
                  より高精度な「Deepthink」分析など、全ての機能を利用できます。
                </p>
                <button
                  onClick={handleUpgradeClick}
                  disabled={isRedirecting}
                  className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
                >
                  {isRedirecting ? "処理中..." : "プレミアムに登録する"}
                </button>
                {paymentError && <p className="text-red-500 mt-2 text-sm">{paymentError}</p>}
              </div>
            )}

            <Detector session={session} />
          </>
        )}
      </div>
    </main>
  );
}