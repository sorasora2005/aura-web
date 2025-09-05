"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Sparkles, Crown, Home } from "lucide-react";
import type { Session } from '@supabase/supabase-js';

// 検証ステータスを管理するための型
type VerificationStatus = 'pending' | 'success' | 'error';

// --- 3つの状態に対応するUIコンポーネント ---

// 1. 検証中のローディング画面
const LoadingState = () => (
  <Card className="w-full max-w-md shadow-lg border-0">
    <CardContent className="p-8 text-center space-y-4">
      <div className="flex justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">決済状況を確認しています...</h1>
      <p className="text-slate-500">
        プランを更新しています。このまましばらくお待ちください。
      </p>
    </CardContent>
  </Card>
);

// 2. 検証成功時の表示
const SuccessState = () => (
  <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
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
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          <span className="text-lg font-semibold text-slate-800">
            プレミアムプランが有効になりました
          </span>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-slate-700 text-sm leading-relaxed">
            全ての機能をお楽しみいただけます。
          </p>
        </div>
      </div>
      <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" size="lg">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          ホームに戻る
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// 3. 検証失敗時のエラー画面
const ErrorState = ({ message }: { message: string }) => (
  <Card className="w-full max-w-md shadow-lg border-0">
    <CardContent className="p-8 text-center space-y-6">
      <div className="flex justify-center">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">決済の確認に失敗しました</h1>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      <p className="text-slate-500 text-sm">
        問題が解決しない場合は、サポートまでお問い合わせください。
      </p>
      <Button asChild variant="outline" className="w-full">
        <Link href="/">
          <Home className="w-4 h-4 mr-2" />
          ホームに戻る
        </Link>
      </Button>
    </CardContent>
  </Card>
);


// --- メインコンポーネント ---

export default function SuccessPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // 1. session_idがURLに存在しない場合、不正なアクセスとみなしホームへリダイレクト
    if (!sessionId) {
      router.replace('/');
      return;
    }

    const verifySession = async (session: Session | null) => {
      // 2. ユーザーがログインしていない場合
      if (!session) {
        setStatus('error');
        setErrorMessage('認証情報が見つかりません。再度ログインしてお試しください。');
        return;
      }

      try {
        // 3. バックエンドに決済検証APIを呼び出す
        const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
        const endpoint = `${baseUrl}/v1/payments/verify-session?session_id=${sessionId}`;

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          // APIからエラーが返された場合
          const errorData = await response.json();
          throw new Error(errorData.detail || 'サーバーでエラーが発生しました。');
        }

        // 4. 検証成功
        setStatus('success');

      } catch (error) {
        // 5. 検証プロセス中に何らかのエラーが発生した場合
        console.error("Session verification failed:", error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      }
    }

    // Supabaseのセッションを取得してから検証を開始
    const checkAuthAndVerify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      verifySession(session);
    };

    checkAuthAndVerify();

  }, [router, searchParams, supabase.auth]);

  // ステータスに応じて適切なUIをレンダリング
  const renderContent = () => {
    switch (status) {
      case 'pending':
        return <LoadingState />;
      case 'success':
        return <SuccessState />;
      case 'error':
        return <ErrorState message={errorMessage} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {renderContent()}
    </main>
  );
}