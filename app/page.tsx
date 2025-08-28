// 1. ファイルの先頭に必ずこれを書きます
"use client";

// 2. ReactのuseStateという機能をインポートします
import { useState } from "react";

export default function Home() {
  // 3. コンポーネントの「状態（State）」を定義します
  // テキストエリアの入力内容を保存するための変数
  const [text, setText] = useState("");
  // APIからの結果を保存するための変数
  const [result, setResult] = useState(null);
  // ローディング状態を管理するための変数
  const [isLoading, setIsLoading] = useState(false);

  // 4. ボタンがクリックされたときに実行する関数
  const handleSubmit = async () => {
    // ボタンをローディング状態にする
    setIsLoading(true);
    setResult(null); // 前回の結果をクリア

    // ここにAPIを呼び出す処理を後で書きます
    console.log("Submitting text:", text);

    // ダミーの待機時間（APIっぽさを出すため）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ダミーのレスポンス
    const dummyResponse = {
      score: Math.random(), // 0から1のランダムな数値
      is_ai: Math.random() > 0.5,
    };

    // 結果をStateに保存
    setResult(dummyResponse);
    // ローディング状態を解除
    setIsLoading(false);
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