import { z } from "zod";

// スキーマを定義してエクスポートする
export const AiResponseSchema = z.object({
  is_ai: z.boolean(),
  score: z.number(),
});

// 他のスキーマもここに追加できる
