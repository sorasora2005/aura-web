"use client";

import { Detection } from "@/lib/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History as HistoryIcon, Brain, User, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  detections: Detection[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
};

// スコアをパーセンテージ表示にフォーマットする関数
const formatScore = (score: number) => (score * 100).toFixed(1);

export default function History({ detections, onLoadMore, hasMore, isLoading }: Props) {
  if (detections.length === 0 && !isLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-xl">判定履歴</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-slate-500">まだ判定履歴がありません。</p>
          <p className="text-sm text-slate-400 mt-2">AI判定を実行すると、結果がここに保存されます。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-xl">判定履歴</CardTitle>
        </div>
        <CardDescription>
          過去のAI判定結果を一覧で確認できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {detections.map((item) => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <div className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.is_ai ? "destructive" : "default"} className={item.is_ai ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {item.is_ai ? "AI" : "人間"}
                      </Badge>
                      <p className="font-mono text-sm text-slate-700 font-medium">
                        Score: {formatScore(item.score)}%
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {format(new Date(item.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {item.input_text}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>判定結果詳細</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm font-medium">判定日時</span>
                    <span className="text-sm">{format(new Date(item.created_at), "yyyy年MM月dd日 HH:mm:ss", { locale: ja })}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm font-medium">最終判定</span>
                    <Badge variant={item.is_ai ? "destructive" : "default"} className="text-sm">
                      {item.is_ai ? <Brain className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                      {item.is_ai ? "AI生成の可能性が高い" : "人間による執筆の可能性が高い"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                    <span className="text-sm font-medium">AI生成の確率</span>
                    <span className="text-lg font-bold text-blue-600">{formatScore(item.score)}%</span>
                  </div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">入力テキスト全文</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-60 w-full rounded-md border p-4 bg-slate-50 text-sm">
                        {item.input_text}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  読み込み中...
                </>
              ) : (
                "さらに読み込む"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}