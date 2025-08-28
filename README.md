# 🖥️ Aura Web

Auraプロジェクトのフロントエンドです。ユーザーが文章を入力し、AIによる判定結果を直感的に確認するためのWebインターフェースを提供します。バックエンドの`aura-api`と連携して動作します。

## 🚀 概要

* **フレームワーク**: **Next.js** (App Router)
* **言語**: **TypeScript**
* **UIライブラリ**: (Chakra UI, Mantineなどを想定)
* **デプロイ環境**: **Vercel**

## ✨ 主な機能

* テキストを入力してAI判定をリクエストする機能
* `aura-api`から返却された判定スコアを視覚的に表示
* (将来実装) ユーザー認証機能
* (将来実装) 過去の判定履歴の閲覧機能

## 🛠️ ローカルでの実行方法

### 1. 前提条件

* Node.js (v18.17以上)
* npm, yarn, または pnpm

### 2. リポジトリのクローン

```bash
git clone https://github.com/<your-username>/aura-web.git
cd aura-web
```

### 3. 依存関係のインストール

```bash
npm install
# or yarn install
```

### 4. 環境変数の設定

プロジェクトのルートに`.env.local`というファイルを作成し、接続先のバックエンドAPIのエンドポイントを設定します。

```env
# .env.local

# ローカルのバックエンドAPIを動かす場合
NEXT_PUBLIC_API_ENDPOINT="http://127.0.0.1:8000"

# デプロイ済みのCloud RunのAPIを動かす場合
# NEXT_PUBLIC_API_ENDPOINT="https://your-cloud-run-url-xxxx.a.run.app"
```

`NEXT_PUBLIC_` のプレフィックスはNext.jsで必須です。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスすると、開発中のアプリケーションが表示されます。