import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          決済はキャンセルされました
        </h1>
        <p className="text-gray-700 mb-6">
          支払いがキャンセルされたか、エラーが発生しました。プランは変更されていません。
        </p>
        <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}