// 1. ファイルの先頭に必ずこれを書きます
"use client";

// 2. ReactのuseStateという機能をインポートします
import { useState } from "react";
import { AiResponseSchema, AiResponseType } from '@/lib/schemas';
import { getErrorMessage } from '@/lib/errorUtils';


export default function Home() {
  // 3. コンポーネントの「状態（State）」を定義します
  // テキストエリアの入力内容を保存するための変数
  const [text, setText] = useState("");
  // APIからの結果を保存するための変数
  const [result, setResult] = useState<AiResponseType | null>(null);
  // ローディング状態を管理するための変数
  const [isLoading, setIsLoading] = useState(false);
  // エラーメッセージ用のStateを追加
  const [error, setError] = useState<string | null>(null);


  // 4. ボタンがクリックされたときに実行する関数
  const handleSubmit = async () => {
    // ボタンをローディング状態にする
    setIsLoading(true);
    setResult(null); // 前回の結果をクリア
    setError(null); // エラーをクリア

    // ここにAPIを呼び出す処理を後で書きます
    console.log("Submitting text:", text);
    // --- API呼び出し処理 ---
    try {
      // .env.localからAPIエンドポイントを取得
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      if (!baseUrl) {
        throw new Error("APIエンドポイントが設定されていません。");
      }

      // ベースURLとパスを結合して完全なURLを作成
      const endpoint = `${baseUrl}/v1/detect`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      // APIからのレスポンスがエラーだった場合
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      // レスポンスのJSONをパース
      const rawData = await response.json();
      const validatedData = AiResponseSchema.parse(rawData);
      setResult(validatedData);

    } catch (err) {
      // エラーが発生した場合
      console.error(err);
      setError(getErrorMessage(err) || "予期せぬエラーが発生しました。");
    } finally {
      // 成功・失敗に関わらずローディングを解除
      setIsLoading(false);
    }
    // --- ここまで ---
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Aura: AI Text Detector
        </h1>

        {/* 5. 画面に表示する要素 (JSX) */}
        <div className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={10}
            placeholder="ここに文章をペーストしてください..."
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !text}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "判定中..." : "判定する"}
          </button>
        </div>

        {/* エラーメッセージ表示エリア */}
        {error && (
          <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p><strong>エラー:</strong> {error}</p>
          </div>
        )}

        {/* 6. 結果を表示するエリア */}
        {result && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">判定結果</h2>
            <div className="text-lg">
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
    </main>
  );
}