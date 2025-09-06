// components/AuraClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import { AiResponseType } from '@/lib/schemas';
import Detector from "@/components/Detector";
import History from "@/components/History";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, Crown, PenSquare, History as HistoryIcon } from "lucide-react";
import { ListDetectionsResponseSchema, Detection } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/errorUtils";

// ユーザープロファイルの型を定義
type UserProfile = {
  plan: 'free' | 'premium';
  request_count: number;
};

// 決済セッション作成をリクエストする関数
const createCheckoutSession = async (accessToken: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
  if (!baseUrl) {
    throw new Error("APIエンドポイントが設定されていません。");
  }
  const endpoint = `${baseUrl}/v1/payments/create-checkout-session`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "決済ページの作成に失敗しました。");
  }

  const data = await response.json();
  return data.url;
};

export default function AuraClient() {
  // Supabaseクライアントのインスタンスを作成
  const supabase = createClient();

  // ユーザーのセッション情報を保存するためのState
  const [session, setSession] = useState<Session | null>(null);
  // 認証状態の読み込みを管理
  const [loading, setLoading] = useState(true);

  // 追加のState
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 履歴機能用のState
  const [detections, setDetections] = useState<Detection[]>([]);
  const [historyPage, setHistoryPage] = useState(0); // 0-indexed page
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("detector");
  const HISTORY_PAGE_LIMIT = 3;

  // Detector の状態を親で管理する
  const [detectorText, setDetectorText] = useState("");
  const [detectionResult, setDetectionResult] = useState<AiResponseType | null>(null);


  // 履歴取得関数
  const fetchHistory = useCallback(async (page: number, fresh = false) => {
    if (!session) return;
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT;
      const skip = page * HISTORY_PAGE_LIMIT;
      const endpoint = `${baseUrl}/v1/detections?skip=${skip}&limit=${HISTORY_PAGE_LIMIT}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("履歴の取得に失敗しました。");
      }
      const rawData = await response.json();
      const validatedData = ListDetectionsResponseSchema.parse(rawData);

      setDetections(prev => fresh ? validatedData.items : [...prev, ...validatedData.items]);
      setHasMoreHistory(validatedData.items.length === HISTORY_PAGE_LIMIT);

    } catch (err) {
      setHistoryError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, [session]);

  // ページネーション用の関数
  const loadMoreHistory = () => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchHistory(nextPage);
  };

  // 判定成功時に履歴をリフレッシュする関数
  const handleDetectionSuccess = () => {
    // 既存の履歴をクリアして、再取得を促す
    setDetections([]);
    setHistoryPage(0);
    setHasMoreHistory(true);
    // これで、次に履歴タブを開いたときに useEffect が走り、fetchHistory(0) が実行される
  };

  // コンポーネントがマウントされた時に一度だけ実行
  useEffect(() => {
    // 現在のセッションとプロファイル情報を取得する非同期関数
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // ログインしている場合、プロフィール情報を取得
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan, request_count')
          .single();
        setProfile(profileData as UserProfile);
      }

      setLoading(false);
    };

    getSessionAndProfile();

    // 認証状態（ログイン、ログアウトなど）が変化したときに発火するイベントリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // 認証状態が変わったらプロフィールも再取得
        if (session) {
          const getProfile = async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('plan, request_count')
              .single();
            setProfile(profileData as UserProfile);
          };
          getProfile();
        } else {
          setProfile(null);
          // ログアウト時に履歴をクリア
          setDetections([]);
          setHistoryPage(0);
          setHasMoreHistory(true);
        }
      }
    );

    // コンポーネントがアンマウントされるときにイベントリスナーを解除
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // タブが切り替わったときに履歴を取得するEffect
  useEffect(() => {
    // 履歴タブが選択され、かつデータがまだ読み込まれていない場合に最初のデータを取得
    if (activeTab === 'history' && detections.length === 0 && hasMoreHistory) {
      fetchHistory(0);
    }
  }, [activeTab, detections.length, fetchHistory, hasMoreHistory]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ページをリロードして状態をリセット
    window.location.reload();
  };

  // アップグレード処理
  const handleUpgradeClick = async () => {
    if (!session) return;
    setIsRedirecting(true);
    setPaymentError(null);
    try {
      const checkoutUrl = await createCheckoutSession(session.access_token);
      // Stripeの決済ページへリダイレクト
      window.location.href = checkoutUrl;
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "不明なエラーが発生しました。");
      setIsRedirecting(false);
    }
  };

  return (
    loading ? (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">読み込み中...</span>
        </CardContent>
      </Card>
    ) : !session ? (
      // 未ログイン時の認証UI
      <Card className="max-w-md mx-auto shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            アカウントにログインして AI 判定機能をご利用ください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              style: {
                button: {
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                },
                input: {
                  borderRadius: '8px',
                  fontSize: '14px'
                }
              }
            }}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: '********',
                  button_label: 'サインイン',
                  social_provider_text: '{{provider}}でサインイン',
                  link_text: 'アカウントをお持ちですか？ サインイン',
                },
                sign_up: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: '********',
                  button_label: 'サインアップ',
                  social_provider_text: '{{provider}}でサインアップ',
                  link_text: 'アカウントがありませんか？ サインアップ',
                },
                forgotten_password: {
                  email_label: 'メールアドレス',
                  button_label: 'パスワードをリセット',
                  link_text: 'パスワードをお忘れですか？',
                }
              }
            }}
          />
        </CardContent>
      </Card>
    ) : (
      // ログイン済みの場合
      <>
        {/* ユーザー情報ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {session.user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-700">
                {session.user.email}
              </p>
              <p className="text-sm text-slate-500">ようこそお帰りなさい</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <Badge
                variant={profile.plan === 'premium' ? 'default' : 'secondary'}
                className={profile.plan === 'premium'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0'
                  : 'bg-slate-100 text-slate-700'
                }
              >
                {profile.plan === 'premium' ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                  </>
                ) : (
                  'FREE'
                )}
              </Badge>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>

        {/* プレミアムアップグレードセクション */}
        {profile?.plan === 'free' && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                プレミアムプランにアップグレード
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                より高精度な「Deepthink」分析など、全ての機能を利用できます。
                プロフェッショナルな文章判定をお試しください。
              </p>
              <Button
                onClick={handleUpgradeClick}
                disabled={isRedirecting}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 shadow-lg"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    プレミアムに登録する
                  </>
                )}
              </Button>
              {paymentError && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {paymentError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* タブUIセクション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detector">
              <PenSquare className="w-4 h-4 mr-2" />
              AI判定
            </TabsTrigger>
            <TabsTrigger value="history">
              <HistoryIcon className="w-4 h-4 mr-2" />
              判定履歴
            </TabsTrigger>
          </TabsList>
          <TabsContent value="detector" className="mt-6">
            <Detector session={session} onDetectionSuccess={handleDetectionSuccess} text={detectorText} setText={setDetectorText} result={detectionResult} setResult={setDetectionResult} />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            {historyError ? (
              <Alert variant="destructive">
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            ) : (
              <History
                detections={detections}
                onLoadMore={loadMoreHistory}
                hasMore={hasMoreHistory}
                isLoading={historyLoading}
              />
            )}
          </TabsContent>
        </Tabs>
      </>
    )
  );
}