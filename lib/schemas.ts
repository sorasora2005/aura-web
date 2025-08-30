import { z } from "zod";

// スキーマを定義してエクスポートする
export const AiResponseSchema = z.object({
  is_ai: z.boolean(),
  score: z.number(),
});

// ↑のスキーマからTypeScriptの型を生成してエクスポート
export type AiResponseType = z.infer<typeof AiResponseSchema>;

// 他のスキーマもここに追加できる
