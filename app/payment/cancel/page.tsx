import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw, HelpCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        {/* キャンセル表示背景 */}
        <div className="relative bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm