// components/dashboard/UsageOverview.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Lightbulb, Percent, BarChartHorizontal, Calendar } from "lucide-react";
import { format, parseISO } from 'date-fns';
import type { DashboardStats } from "@/lib/schemas";

type Props = {
  stats: DashboardStats;
  profile: { plan: 'free' | 'premium', request_count: number };
};

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
  <Card className="bg-slate-50/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className="h-4 w-4 text-slate-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </CardContent>
  </Card>
);

export default function UsageOverview({ stats, profile }: Props) {
  const planLimit = profile.plan === 'premium' ? 1000 : 100;
  const progressValue = Math.min((stats.total_requests / planLimit) * 100, 100);

  const chartData = stats.daily_activity.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'M/d'),
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChartHorizontal className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">利用状況サマリー</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 主要統計 */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="累計判定回数" value={stats.total_requests.toLocaleString()} icon={Lightbulb} />
          <StatCard title="AI判定率" value={`${(stats.ai_detection_rate * 100).toFixed(1)}%`} icon={Percent} />
          <StatCard title="平均スコア" value={stats.average_score.toFixed(3)} icon={BarChartHorizontal} />
        </div>

        {/* リクエスト上限 */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2">今月のリクエスト数</h4>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-slate-500">
              プラン上限: {planLimit.toLocaleString()}回
            </span>
            <span className="font-semibold text-slate-700">
              {stats.total_requests.toLocaleString()} / {planLimit.toLocaleString()}
            </span>
          </div>
          <Progress value={progressValue} className="h-3" />
        </div>

        {/* アクティビティグラフ */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            過去30日間のアクティビティ
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}