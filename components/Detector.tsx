"use client";

import type { Session } from "@supabase/supabase-js";
import { AiResponseType, AiResponseSchema } from '@/lib/schemas';
import { getErrorMessage } from '@/lib/errorUtils';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from 'react';
// Icons
import { Loader2, Brain, User, AlertTriangle, CheckCircle, FileText, Sparkles, Zap } from "lucide-react";

// SupabaseのSessionをPropsとして受け取るように型定義
type Props = {
  session: Session;
  onDetectionSuccess: () => void; // 判定成功時のコールバック関数
  text: string;
  setText: (text: string) => void;
  result: AiResponseType | null;
  setResult: (result: AiResponseType | null) => void;
  // 状態管理をAuraClientから受け取る（State Lifting）
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

export default function Detector({
  session,
  onDetectionSuccess,
  text,
  setText,
  result,
  setResult,
  isLoading,
  setIsLoading,
  error,
  setError
}: Props) {

  const handleSubmit = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      if (!baseUrl) {
        throw new Error("APIエンドポイントが設定されていません。");
      }

      const accessToken = session.access_token;
      const endpoint = `${baseUrl}/v1/detect`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("認証エラー: トークンが無効または期限切れです。再度ログインしてください。");
        }
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      // APIレスポンスをパース
      const validatedData = AiResponseSchema.parse(rawData);
      setResult(validatedData);

      onDetectionSuccess();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { level: "高", color: "text-red-600" };
    if (score >= 0.6) return { level: "中", color: "text-yellow-600" };
    return { level: "低", color: "text-green-600" };
  };

  const formatScore = (score: number) => (score * 100).toFixed(1);


  /**
   * ◆ 詳細分析結果を基に、テキストをハイライトするJSXを生成する関数
   */
  const renderHighlightedText = () => {
    if (!result?.detailed_analysis || result.detailed_analysis.length === 0) {
      // ハイライト対象がない場合は、元のテキストをそのまま表示
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    // 解析結果を位置情報に変換し、開始位置でソート
    const highlights = result.detailed_analysis
      .map(item => {
        const startIndex = text.indexOf(item.sentence);
        if (startIndex === -1) return null; // 元のテキストに見つからない場合は除外
        return {
          start: startIndex,
          end: startIndex + item.sentence.length,
          reason: item.reason,
          sentence: item.sentence
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null) // nullを除外
      .sort((a, b) => a.start - b.start);

    if (highlights.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    const parts: ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, i) => {
      // 前回のハイライトの終わりから今回のハイライトの始まりまでのテキスト（ハイライトなし）
      if (highlight.start > lastIndex) {
        parts.push(text.substring(lastIndex, highlight.start));
      }

      // ハイライト部分を生成
      parts.push(
        <TooltipProvider key={`highlight-${i}`} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <mark className="bg-blue-200/80 hover:bg-blue-300 cursor-pointer px-1 rounded transition-colors duration-200">
                {highlight.sentence}
              </mark>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-sm bg-slate-800 text-white border-slate-700 shadow-lg">
              <p>{highlight.reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      lastIndex = highlight.end;
    });

    // 最後のハイライト以降のテキスト（ハイライトなし）
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-slate-800">
        {parts.map((part, index) => <span key={index}>{part}</span>)}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* 入力セクション */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-xl">文章を入力</CardTitle>
          </div>
          <CardDescription>判定したい文章を下記のテキストエリアに貼り付けてください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-none focus:ring-2 focus:ring-blue-500 border-slate-200"
            placeholder="ここに文章をペーストしてください..."
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              文字数: {text.length.toLocaleString()}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中... </>
              ) : (
                <> <Brain className="w-4 h-4 mr-2" /> AI判定を実行 </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-700">
            <strong>エラー:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 結果表示 */}
      {result && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle className="text-2xl">判定結果</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* スコア表示 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">AI生成の確率</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatScore(result.score)}%
                </span>
              </div>
              <Progress value={result.score * 100} className="h-3" />
            </div>

            {/* 判定結果 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-white/50">
                <div className="flex items-center gap-2 mb-2">
                  {result.is_ai ? (
                    <Brain className="w-5 h-5 text-red-600" />
                  ) : (
                    <User className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-semibold text-slate-700">最終判定</span>
                </div>
                <Badge
                  variant={result.is_ai ? "destructive" : "default"}
                  className={`text-base px-3 py-1 ${result.is_ai ? "bg-red-100 text-red-800 hover:bg-red-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`}
                >
                  {result.is_ai ? "AI生成の可能性が高い" : "人間による執筆の可能性が高い"}
                </Badge>
              </div>
              <div className="p-4 rounded-lg border bg-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-slate-700">信頼度</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-base px-3 py-1 border-current ${getConfidenceLevel(result.score).color}`}
                >
                  {getConfidenceLevel(result.score).level}
                </Badge>
              </div>
            </div>

            {/* ◆◆◆ ここからが新規追加セクション ◆◆◆ */}
            {/* 詳細分析セクション (プレミアム機能) */}
            <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                詳細分析 (プレミアム機能)
              </h4>

              {result.detailed_analysis === null ? (
                // Freeユーザーの場合
                <div className="text-center p-6 border-2 border-dashed rounded-lg bg-white">
                  <h5 className="font-bold text-slate-700 mb-2">文章のハイライト機能</h5>
                  <p className="text-sm text-slate-600 mb-4">
                    どの部分がAIによって生成された可能性があるかを詳細に分析・ハイライト表示する機能は、プレミアムプランでご利用いただけます。
                  </p>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow hover:shadow-md transition-shadow">
                    <Zap className="w-4 h-4 mr-2" />
                    プレミアムにアップグレード
                  </Button>
                </div>
              ) : result.detailed_analysis.length > 0 ? (
                // Premiumユーザーで分析結果がある場合
                <div className="p-4 border rounded-md bg-white text-sm max-h-72 overflow-y-auto shadow-inner">
                  {renderHighlightedText()}
                </div>
              ) : (
                // Premiumユーザーだが分析結果がない場合 (is_ai: falseなど)
                <div className="text-sm text-slate-500 p-3 bg-white rounded-md border text-center">
                  AI特有のパターンは検出されませんでした。
                </div>
              )}
            </div>
            {/* ◆◆◆ 新規追加セクションここまで ◆◆◆ */}

            {/* 判定について */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">判定概要</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {result.is_ai
                  ? `この文章はAIによって生成された可能性が${formatScore(result.score)}%です。文章の構造、語彙選択、文体などからAI特有のパターンが検出されました。`
                  : `この文章は人間によって書かれた可能性が${formatScore(1 - result.score)}%です。自然な文章の流れや人間らしい表現が確認されました。`
                }
              </p>
            </div>

            {/* 注意事項 */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> ご注意
              </h4>
              <p className="text-amber-800 text-sm">
                この判定結果は参考情報です。100%の精度を保証するものではありません。
                重要な判断を行う際は、他の検証方法も合わせてご利用ください。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}