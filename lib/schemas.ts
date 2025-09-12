import { z } from "zod";

// ◆ 1. 詳細分析の単一アイテムのスキーマを定義
export const AnalysisItemSchema = z.object({
  sentence: z.string(),
  reason: z.string(),
});

// スキーマを定義してエクスポートする
export const AiResponseSchema = z.object({
  is_ai: z.boolean(),
  score: z.number().min(0).max(1),
  detailed_analysis: z.array(AnalysisItemSchema).nullable(),
});

// ↑のスキーマからTypeScriptの型を生成してエクスポート
export type AiResponseType = z.infer<typeof AiResponseSchema>;

// 他のスキーマもここに追加できる


// 単一の履歴アイテムのスキーマ
export const DetectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  input_text: z.string(),
  score: z.number().min(0).max(1),
  is_ai: z.boolean(),
  created_at: z.string().datetime(), // APIからはISO文字列で渡される
  detailed_analysis: z.array(AnalysisItemSchema).nullable(),
});

// 履歴アイテムの配列のスキーマ
export const DetectionsListSchema = z.array(DetectionSchema);

// APIレスポンス全体のスキーマ (/v1/detections)
export const ListDetectionsResponseSchema = z.object({
  items: DetectionsListSchema,
  total: z.number().int(),
});

// フロントエンドで使いやすいように型をエクスポート
export type Detection = z.infer<typeof DetectionSchema>;

// ダッシュボード統計API用のスキーマを追加
export const DailyActivitySchema = z.object({
  date: z.string(), // or z.date() if you parse it
  count: z.number(),
});

export const DashboardStatsResponseSchema = z.object({
  total_requests: z.number(),
  ai_detection_rate: z.number(),
  average_score: z.number(),
  daily_activity: z.array(DailyActivitySchema),
});

export type DashboardStats = z.infer<typeof DashboardStatsResponseSchema>;
