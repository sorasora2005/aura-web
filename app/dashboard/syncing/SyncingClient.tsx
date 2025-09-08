"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, Home } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

// 同期ステータスを管理するための型
type SyncStatus = "pending" | "error";

// --- 2つの状態に対応するUIコンポーネント ---

// 1. 同期中のローディング画面
const LoadingState = () => (
  <Card className="w-full max-w-md shadow-lg border-0">
    <CardContent className="p-8 text-center space-y-4">
      <div className="flex justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">
        プラン情報を更新しています...
      </h1>
      <p className="text-slate-500">
        最新の情報を取得しています。このまましばらくお待ちください。
      </p>
    </CardContent>
  </Card>
);

// 2. 同期失敗時のエラー画面
const ErrorState = ({ message }: { message: string }) => (
  <Card className="w-full max-w-md shadow-lg border-0">
    <CardContent className="p-8 text-center space-y-6">
      <div className="flex justify-center">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">
        情報の更新に失敗しました
      </h1>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      <p className="text-slate-500 text-sm">
        問題が解決しない場合は、サポートまでお問い合わせください。
      </p>
      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard">
          <Home className="w-4 h-4 mr-2" />
          ダッシュボードに戻る
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// --- メインコンポーネント ---

export default function SyncingClient() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<SyncStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const syncSubscription = async (session: Session | null) => {
      // 1. ユーザーがログインしていない場合
      if (!session) {
        setStatus("error");
        setErrorMessage(
          "認証情報が見つかりません。再度ログインしてお試しください。"
        );
        return;
      }

      try {
        // 2. バックエンドの同期エンドポイントを呼び出す
        const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
        const endpoint = `${baseUrl}/v1/payments/sync-subscription`;

        const response = await fetch(endpoint, {
          method: "POST", // POSTメソッドでリクエスト
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          // APIからエラーが返された場合
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "サーバーでエラーが発生しました。"
          );
        }

        // 3. 同期が成功したら、ダッシュボードに遷移
        // replaceを使うとブラウザの履歴に残らないため、ユーザーが「戻る」ボタンで
        // この同期ページに戻ってしまうのを防げます。
        router.replace("/dashboard");
      } catch (error) {
        // 4. 同期プロセス中に何らかのエラーが発生した場合
        console.error("Subscription sync failed:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "不明なエラーが発生しました。"
        );
      }
    };

    // Supabaseのセッションを取得してから同期処理を開始
    const checkAuthAndSync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await syncSubscription(session);
    };

    checkAuthAndSync();
  }, [router, supabase.auth]);

  // ステータスに応じて適切なUIをレンダリング
  const renderContent = () => {
    switch (status) {
      case "pending":
        return <LoadingState />;
      case "error":
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
