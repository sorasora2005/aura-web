# フロントエンド

---

# **aura-web 開発者ドキュメント**

## **1. プロジェクト構成**

- **Next.js 15 App Router 構成**
    
    app ディレクトリを中心にページやレイアウトを管理。
    
    - 静的な部分は page.tsx でSSR/SSG活用。
    - layout.tsx: 全体レイアウト
    - payment: 決済関連ページ（`success`, `cancel`）
    - dashboard: ダッシュボード機能を提供
- **コンポーネント**
    - AuraClient.tsx: メインUI（認証・決済・AI判定・履歴タブUIを統括）
    - Detector.tsx: AI判定UI
    - History.tsx: 判定履歴UI
    - `dashboard/`配下
        - DashboardClient.tsx: ダッシュボードの状態管理・データ取得
        - UsageOverview.tsx: 利用状況サマリー（統計・グラフ）
        - AccountManagement.tsx: アカウント管理（パスワード変更・削除）
        - PlanAndBilling.tsx: プラン・請求管理（アップグレード・Stripe連携）
        - RecentDetections.tsx: 最近の判定履歴
    - `ui/`: Card, Button, Badge, Alert, Progress, Textarea, Tabs など共通UI
- **ライブラリ・ユーティリティ**
    - client.ts: Supabaseクライアント生成
    - schemas.ts, errorUtils.ts: バリデーションやエラー処理
- **設定ファイル**
    - .env.local, .env.production: APIキーやエンドポイント
    - package.json: 依存パッケージ・スクリプト
- ディレクトリ構造（詳細）

```jsx
.env.local
.env.production
.gitignore
.next
node_modules
components.json
eslint.config.mjs
next-env.d.ts
next.config.ts
package.json
package-lock.json
postcss.config.mjs
README.md
tsconfig.json
app/
  favicon.ico
  globals.css
  layout.tsx
  page.tsx
  dashboard/
    syncing/
      page.tsx
      SyncingClient.tsx
	  page.tsx
  payment/
    cancel/
      page.tsx
    success/
      page.tsx
      SuccessPageClient.tsx
components/
	AuraClient.tsx
  Detector.tsx
  History.tsx
  dashboard/
	  AccountManagement.tsx
	  DashboardClient.tsx
	  PlanAndBilling.tsx
	  RecentDetections.tsx
	  UsageOverview.tsx
  ui/
    accordion.tsx
	alert-dialog.tsx
    alert.tsx
    badge.tsx
    button.tsx
    card.tsx
    dialog.tsx
    dropdown-menu.tsx
    progress.tsx
    scroll-area.tsx
    tabs.tsx
    textarea.tsx
    tooltip.tsx
lib/
  supabase/
    client.ts
  errorUtils.ts
  schemas.ts
  utils.ts
public/
  （静的ファイル群）
```

---

## **2. UI/UX設計**

### **認証フロー**

- **Supabase Auth**
    - `@supabase/auth-ui-react` + ThemeSupa で認証UIを提供
    - ログイン状態は Session で管理し、useState/useEffect で状態同期
    - ログイン後はプロファイル情報（プラン・リクエスト数）を取得し、UIに反映

### **メインページ (`app/page.tsx`)**

- **未ログイン時**
    - Supabase Auth UIを表示
    - ログイン後に自動で状態が切り替わる
- **ログイン時**
    - プランバッジ（free/premium）とリクエスト数を表示
    - AI検出機能（`<Detector />`）を利用可能
    - プランが free の場合は「アップグレード」ボタンを表示し、決済ページへ遷移
    - ログアウトボタンあり
- **ローディング・エラー**
    - ローディング時は Loader2 アイコン
    - エラー時は Alert で詳細表示

### **ダッシュボード (`/dashboard`)**

- **v5.0新設**
    - `/dashboard` でアカウント情報・利用状況・プラン管理・履歴を一元管理
    - DashboardClient.tsx が状態管理・データ取得を担当
    - サブウィジェットとして以下を表示
        - UsageOverview: 利用統計・グラフ
        - AccountManagement: メールアドレス表示、パスワード変更、アカウント削除（ダイアログ確認付き）
            - **プレミアムユーザーの場合**: アカウント削除時に、freeユーザーよりも強い警告メッセージを表示。削除による即時サービス停止やデータ復旧不可について明示。
        - PlanAndBilling: プラン表示、アップグレード、Stripeポータル連携
        - RecentDetections: 直近の判定履歴（最大5件）

### **決済フロー**

- **アップグレードボタン**
    - createCheckoutSession 関数で FastAPI バックエンドに決済セッション作成リクエスト
    - JWT（Supabaseのaccess_token）をAuthorizationヘッダーで送信
    - 成功時はStripeのCheckoutページへリダイレクト
    - 失敗時はエラーメッセージを表示
- **決済完了ページ（`app/payment/success/SuccessPageClient.tsx`）/キャンセルページ(`app/payment/cancel/page.tsx`)**
    - URLの `session_id` を検証
    - セッション未取得時はトップへリダイレクト
    - Supabaseセッションが無効ならエラー表示
    - FastAPIの `/v1/payments/verify-session` で決済検証（JWT認証）
    - 検証失敗時は詳細なエラー表示
    - 検証中・成功・失敗でUIを切り替え（ローディング・成功・エラー）
- **Stripeポータル連携**
    - Stripeポータルから戻る際、バックエンドの `/sync-subscription` エンドポイントにリクエストを送信
    - 同期成功後、ダッシュボードにリダイレクト
    - プランのダウングレード時、解約日をバックエンドから取得し、PlanAndBilling.tsx に表示
    - **メール通知設定**
        - サブスクリプション登録完了時、または解約が完全に完了した際に、ユーザーにメールが送信される。
        - 解約登録（例: 残り1ヶ月で解約予定）や登録キャンセルのイベントではメールは送信されない。

### **AI検出機能 (`components/Detector.tsx`)**

- テキストエリアに入力し、「判定」ボタンでAPIリクエスト
- SupabaseのJWTをAuthorizationヘッダーに付与
- レスポンスに応じて結果やエラーをUI表示
- **プレミアムユーザー向け詳細分析**
    - `detailed_analysis` フィールドを利用し、AI生成の可能性が高い文章部分をハイライト表示
    - ShadCNのTooltipを使用して、ハイライト部分に説明を表示
- **UI改善**
    - 文字数が10,000文字を超えると枠が赤く光り、ボタンが無効化される
    - 現在の文字数をリアルタイムで表示
- ローディング時はスピナー表示

### **タブUI**

- **AuraClient.tsx** で「AI判定」「判定履歴」タブを導入
    - Tabs, TabsList, TabsTrigger, TabsContent（Radix UIベース）
    - 履歴タブはページネーション・ローディング・エラー表示に対応
    - 判定成功時は履歴を自動リフレッシュ
    - タブ切替時にURLクエリ `?tab=history` を付与するよう修正

---

## **3. 認証機能**

- **Supabase Auth**
    - client.ts で createBrowserClient を利用し、環境変数からURL/Anonキーを取得
    - supabase.auth.getSession() でセッション取得
    - supabase.auth.onAuthStateChange で認証状態の変化を監視し、プロファイル情報も再取得
    - ログアウトは supabase.auth.signOut() で実行
    - **削除済みアカウントの制御**
        - プロファイル取得時に `profiles` テーブルからデータが見つからない場合、削除済みアカウントとして扱い、ログインを禁止。
        - 削除済みアカウントのユーザーにはエラーダイアログを表示し、強制的にログアウト処理を実行。
---

## **4. 機能詳細**

### **4.1. プロファイル管理**

- `profiles` テーブルから plan, request_count を取得
- プランによってUIや利用可能機能が変化

### **4.2. 決済連携**

- NEXT_PUBLIC_FASTAPI_ENDPOINT で指定したFastAPIサーバーに決済リクエスト
- JWT認証でセキュアにAPI連携
- Stripe Checkoutを利用
- Stripeポータルからの戻り処理に `/syncing` エンドポイントを追加
- 解約日を取得してUIに反映

### **4.3. AI検出API連携**

- `/v1/detect` エンドポイントにPOST
- JWT認証
- レスポンスはZodスキーマ（AiResponseSchema）でバリデーション

### **4.4. 判定履歴機能**

- History.tsx で履歴一覧を表示
    - ページネーション対応（loadMoreHistory）
    - ローディング・エラー時はUIで明示
    - 履歴は fetchHistory でAPIから取得し、Zodスキーマでバリデーション
    - 履歴タブを開いた時のみAPIリクエスト（パフォーマンス配慮）
    - ダッシュボードでは RecentDetections.tsx で直近5件を表示

### **4.5. ダッシュボード機能**

- `/dashboard` でアカウント・統計・プラン・履歴を一元管理
- DashboardClient.tsx が状態管理・データ取得を担当
- サブウィジェットで各機能を分離し、保守性・拡張性を向上
- PlanAndBilling.tsx に解約日表示を追加
---

## **5. 依存パッケージ**

- **UI**: `@radix-ui/react-*`, `clsx`, `lucide-react`
- **認証/DB**: `@supabase/ssr`, `@supabase/supabase-js`, `@supabase/auth-ui-react`
- **Next.js**: v15, App Router, Turbopack
- **API通信**: fetch（JWT認証）
- **バリデーション**: `zod`

---

## **6. 環境変数**

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_FASTAPI_ENDPOINT

---

## **7. 開発Tips**

- **開発サーバー起動**
    
    npm run dev
    
- **型安全**
    - 型定義・Zodスキーマでバリデーション
- **APIエラー処理**
    - getErrorMessage でエラーをユーザーに分かりやすく表示
- **UI拡張**
    - ui 配下に共通UIパーツを追加・拡張可能
- **SSR/SSG活用**
    - 静的な部分は page.tsx でSSR/SSG化し、クライアント側は AuraClient.tsx で管理

---

---

このドキュメントは、プロジェクトの全体像・認証・決済・AI連携・UI/UX設計を理解しやすくまとめています。各機能の拡張や保守の際にご活用ください。