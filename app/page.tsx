"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import Detector from "@/components/Detector";

export default function Home() {
  // Supabaseクライアントのインスタンスを作成
  const supabase = createClient();

  // ユーザーのセッション情報を保存するためのState
  const [session, setSession] = useState<Session | null>(null);
  // 認証状態の読み込みを管理
  const [loading, setLoading] = useState(true);

  // コンポーネントがマウントされた時に一度だけ実行
  useEffect(() => {
    // 現在のセッションを取得する非同期関数
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    // 認証状態（ログイン、ログアウトなど）が変化したときに発火するイベントリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // コンポーネントがアンマウントされるときにイベントリスナーを解除
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ページをリロードして状態をリセット
    window.location.reload();
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
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-red-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
            <Detector session={session} />
          </>
        )}
      </div>
    </main>
  );
}