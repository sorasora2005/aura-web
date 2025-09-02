"use client";

import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AiResponseSchema, AiResponseType } from '@/lib/schemas';
import { getErrorMessage } from '@/lib/errorUtils';

// SupabaseのSessionをPropsとして受け取るように型定義
type Props = {
  session: Session;
};

export default function Detector({ session }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AiResponseType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      if (!baseUrl) {
        throw new Error("APIエンドポイントが設定されていません。");
      }

      // SupabaseセッションからJWTを取得
      const accessToken = session.access_token;

      const endpoint = `${baseUrl}/v1/detect`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // AuthorizationヘッダーにJWTを追加
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        // 401 Unauthorizedエラーの場合、特別なメッセージを表示
        if (response.status === 401) {
          throw new Error("認証エラー: トークンが無効または期限切れです。再度ログインしてください。");
        }
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const validatedData = AiResponseSchema.parse(rawData);
      setResult(validatedData);

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"
          rows={10}
          placeholder="ここに文章をペーストしてください..."
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !text}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "判定中..." : "判定する"}
        </button>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p><strong>エラー:</strong> {error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">判定結果</h2>
          <div className="text-lg space-y-2">
            <p>
              AIが生成した確率:{" "}
              <span className="font-bold text-blue-600">
                {(result.score * 100).toFixed(2)}%
              </span>
            </p>
            <p>
              最終判定:{" "}
              <span className={`font-bold ${result.is_ai ? 'text-red-600' : 'text-green-600'}`}>
                {result.is_ai ? "AIの可能性が高い" : "人間の可能性が高い"}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}