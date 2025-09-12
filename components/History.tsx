"use client";

import { Detection } from "@/lib/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // 追加
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
                <ScrollArea className="max-h-[80vh]">
                  <div className="space-y-4 py-4 pr-6">
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
                        <ScrollArea className="h-40 w-full rounded-md border p-4 bg-slate-50 text-sm">
                          {item.input_text}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* ▼▼▼ ここからが追加されたセクション ▼▼▼ */}
                    {item.detailed_analysis && item.detailed_analysis.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <CardTitle className="text-base">AIによる詳細分析 (プレミアム機能)</CardTitle>
                          </div>
                          <CardDescription>
                            AIが特に「AIによって生成された可能性が高い」と判断した箇所です。
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {item.detailed_analysis.map((analysis, index) => (
                              <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="text-sm text-left hover:no-underline">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                      <AlertTriangle className="w-4 h-4 text-purple-700" />
                                    </div>
                                    <p className="flex-1">{analysis.sentence}</p>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-l-2 border-purple-200 ml-5 pl-5 bg-slate-50 rounded-r-md">
                                  <p className="text-sm text-slate-700">{analysis.reason}</p>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    )}
                    {/* ▲▲▲ ここまでが追加されたセクション ▲▲▲ */}

                  </div>
                </ScrollArea>
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