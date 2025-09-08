import { Suspense } from "react";
import SyncingClient from "./SyncingClient";

/**

Stripeカスタマーポータルからのリダイレクトを受け付けるサーバーコンポーネント。

実際の処理はすべてクライアントコンポーネントに委任します。

Suspenseを使用して、クライアントコンポーネントの読み込み中にフォールバックUI（ローディング画面など）を表示できるようにします。
*/
export default function SyncingPage() {
  return (
    <Suspense>
      <SyncingClient />
    </Suspense>
  );
}