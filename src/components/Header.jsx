import React from 'react';
import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      {/* 페이지 타이틀 */}
      <h1 className="text-xl font-bold text-slate-800">자재 재고 대시보드</h1>

      {/* 우측 유저 프로필 및 알림 */}
      <div className="flex items-center gap-4">
        {/* 알림 버튼 */}
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* 유저 정보 */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <User size={20} />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">환영합니다. 이기범 대표님</p>
            <p className="text-xs text-slate-400">2026년 10월 9일</p>
          </div>
        </div>
      </div>
    </header>
  );
}