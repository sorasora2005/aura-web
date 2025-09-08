// components/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/errorUtils";
import { DashboardStats, DashboardStatsResponseSchema, ListDetectionsResponseSchema, Detection } from "@/lib/schemas";
import { useRouter } from "next/navigation";

// ウィジェットコンポーネント
import UsageOverview from "./UsageOverview";
import AccountManagement from "./AccountManagement";
import PlanAndBilling from "./PlanAndBilling";
import RecentDetections from "./RecentDetections";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

type UserProfile = {
  plan: 'free' | 'premium';
  request_count: number;
  stripe_customer_id?: string;
  plan_expires_at?: string | null; // 解約予定日 (timestampz)
};

export default function DashboardClient() {
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (session: Session) => {
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      if (!baseUrl) throw new Error("APIエンドポイントが設定されていません。");

      // 認証が必要なデータを並行して取得
      const [statsResponse, detectionsResponse, profileResponse] = await Promise.all([
        fetch(`${baseUrl}/v1/dashboard/stats`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${baseUrl}/v1/detections?limit=5`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        supabase.from('profiles').select('plan, request_count, stripe_customer_id, plan_expires_at').single(),
      ]);

      // 各レスポンスを処理
      if (!statsResponse.ok) throw new Error("統計データの取得に失敗しました。");
      const statsData = await statsResponse.json();
      setStats(DashboardStatsResponseSchema.parse(statsData));

      if (!detectionsResponse.ok) throw new Error("履歴データの取得に失敗しました。");
      const detectionsData = await detectionsResponse.json();
      setRecentDetections(ListDetectionsResponseSchema.parse(detectionsData).items);

      if (profileResponse.error) throw profileResponse.error;
      setProfile(profileResponse.data as UserProfile);

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setError("セッションの取得に失敗しました。");
        setLoading(false);
        return;
      }

      if (session) {
        setSession(session);
        fetchData(session);
      } else {
        // 未ログインの場合はログインページにリダイレクト
        router.push('/');
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else if (session) {
        setSession(session);
        fetchData(session);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, [supabase, fetchData, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-lg shadow">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg text-slate-600">ダッシュボードを読み込んでいます...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!session || !profile || !stats) {
    // データが不完全な場合、読み込み中かエラーに戻す
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
      {/* --- ウィジェットを配置 --- */}
      <div className="lg:col-span-2">
        <UsageOverview stats={stats} profile={profile} />
      </div>

      <AccountManagement session={session} />

      <PlanAndBilling session={session} profile={profile} />

      <div className="lg:col-span-2">
        <RecentDetections detections={recentDetections} />
      </div>
    </div>
  );
}