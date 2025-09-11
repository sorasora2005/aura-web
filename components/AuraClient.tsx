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
import { AlertCircle, Loader2, LayoutGrid, LogOut, Crown, ChevronsUpDown, PenSquare, History as HistoryIcon, CalendarClock } from "lucide-react";
import { ListDetectionsResponseSchema, Detection } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/errorUtils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ユーザープロファイルの型を定義
type UserProfile = {
  plan: 'free' | 'premium';
  request_count: number;
  plan_expires_at?: string | null;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLから現在のアクティブなタブを決定する。URLにtabがなければ'detector'をデフォルトに。
  const activeTab = searchParams.get("tab") === "history" ? "history" : "detector";

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

  // Detector の状態を親で管理する（リフトアップ）
  const [detectorText, setDetectorText] = useState("");
  const [detectionResult, setDetectionResult] = useState<AiResponseType | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Alertダイアログ表示用のState
  const [isDeletedAccountDialogOpen, setIsDeletedAccountDialogOpen] = useState(false);

  const HISTORY_PAGE_LIMIT = 3;

  // タブが変更されたときにURLを更新するハンドラ
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "detector") {
      // デフォルトタブの場合はクエリパラメータを削除
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    // URLを書き換える
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

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
  }, [session, HISTORY_PAGE_LIMIT]);

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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        // ログインしている場合、プロフィール情報を取得
        if (session) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('plan, request_count, plan_expires_at')
            .maybeSingle();

          if (error) throw error;
          if (profileData === null) {
            // データが見つからなかった = 削除済みユーザー
            showDeletedAccountDialog();
            return; // 後続の処理を中断
          }
          setProfile(profileData as UserProfile);
        }
      } catch (error) {
        // .maybeSingle()を使った場合、ここに来るのはネットワークエラーなど予期せぬエラーのみ
        console.error("プロファイル取得で予期せぬエラー:", error);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();

    // 認証状態（ログイン、ログアウトなど）が変化したときに発火するイベントリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // 認証状態が変わったらプロフィールも再取得
        if (session) {
          (async () => {
            try {
              // getProfileを定義
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('plan, request_count, plan_expires_at')
                .maybeSingle();

              // エラーがあれば例外を投げる
              if (error) throw error;
              if (profileData === null) {
                // データが見つからなかった = 削除済みユーザー
                showDeletedAccountDialog();
                return; // 後続の処理を中断
              }
              // 有効なユーザーのプロファイルが取得できた          
              setProfile(profileData as UserProfile);

            } catch (error) {
              // ★★★ 型ガードで error の型をチェックする ★★★
              console.log("Caught Error Object:", error);
            } finally {
              // setLoading は try または catch が終わった後に必ず実行される
              setLoading(false);
            }
          })();
        } else {
          setProfile(null);
          // ログアウト時に履歴をクリア
          setDetections([]);
          setHistoryPage(0);
          setHasMoreHistory(true);
          // Detector の状態もクリア
          setDetectorText("");
          setDetectionResult(null);
          setIsDetecting(false);
          setDetectionError(null);
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
    if (activeTab === 'history' && detections.length === 0 && hasMoreHistory && session) {
      fetchHistory(0, true);
    }
  }, [activeTab, detections.length, fetchHistory, hasMoreHistory, session]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ページをリロードして状態をリセット
    window.location.reload();
  };

  const showDeletedAccountDialog = () => {
    setIsDeletedAccountDialogOpen(true);
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
    <>
      {/* ★ 追加: AlertDialogコンポーネント */}
      <AlertDialog open={isDeletedAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              アカウントが削除されました
            </AlertDialogTitle>
            <AlertDialogDescription>
              このアカウントは削除されているため、サービスの利用を継続することはできません。
              「OK」ボタンを押してログアウトしてください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm rounded-xl border"> {/* 💡 bg-white -> bg-card, border-white -> border (border-borderが適用される) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{session.user.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                {/* 💡 text-slate-700 -> text-foreground */}
                <p className="font-medium text-foreground max-w-[200px] sm:max-w-xs truncate">{session.user.email}</p>
                {profile && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={profile.plan === 'premium' ? 'default' : 'secondary'}
                      // 💡 FREEプランのBadgeはvariant="secondary"だけでOK。固定のclassは不要。
                      className={`${profile.plan === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0' : ''}`}
                    >
                      {profile.plan === 'premium' ? <><Crown className="w-3 h-3 mr-1" />PREMIUM</> : 'FREE'}
                    </Badge>
                    {profile.plan_expires_at && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500"> {/* 💡 darkモード用の色を追加 */}
                        <CalendarClock className="w-3 h-3" />
                        <span>解約予定</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* Buttonのvariant="outline"はテーマ対応済みなので変更不要 */}
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    メニュー
                    <ChevronsUpDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                {/* DropdownMenuContentもshadcn/uiコンポーネントなのでテーマ対応済み */}
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      <span>ダッシュボード</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              <Detector
                session={session}
                onDetectionSuccess={handleDetectionSuccess}
                text={detectorText}
                setText={setDetectorText}
                result={detectionResult}
                setResult={setDetectionResult}
                isLoading={isDetecting}
                setIsLoading={setIsDetecting}
                error={detectionError}
                setError={setDetectionError}
              />
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
      )}
    </>
  );
}