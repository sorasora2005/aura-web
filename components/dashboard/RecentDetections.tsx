// components/dashboard/RecentDetections.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import type { Detection } from "@/lib/schemas";

type Props = {
  detections: Detection[];
};

export default function RecentDetections({ detections }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">最近の判定履歴</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {detections.length > 0 ? (
          <div className="space-y-3">
            {detections.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={item.is_ai ? "destructive" : "default"} className={item.is_ai ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {item.is_ai ? "AI" : "人間"}
                      </Badge>
                      <p className="font-mono text-sm text-slate-700 font-medium">
                        Score: {(item.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {item.input_text}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0">
                    {format(new Date(item.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">まだ判定履歴がありません。</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild variant="ghost" className="w-full">
          <Link href="/?tab=history">
            すべての履歴を見る <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}