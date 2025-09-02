import { createBrowserClient } from '@supabase/ssr'

// ブラウザ環境用のSupabaseクライアントを作成する関数
export function createClient() {
  // .env.localファイルからSupabaseのURLとAnonキーを取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // createBrowserClient を使ってクライアントを初期化
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}