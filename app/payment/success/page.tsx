import { Suspense } from 'react';
import SuccessPageClient from './SuccessPageClient';

// Suspenseを使用して、クライアントコンポーネントの読み込み中に
// フォールバックUI（ローディング画面など）を表示できるようにします。
export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessPageClient />
    </Suspense>
  );
}