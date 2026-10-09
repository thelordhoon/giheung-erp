import React from 'react';
import { LayoutDashboard, Package, ArrowUpRight, ArrowDownLeft, BarChart3, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* 로고 영역 */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wider text-white">ㄱㅎ 기흥</span>
          <span className="ml-2 text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded">ERP</span>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
            <LayoutDashboard size={20} />
            대시보드
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Package size={20} />
            재고 현황
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ArrowUpRight size={20} />
            출고 관리
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ArrowDownLeft size={20} />
            입고 관리
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <BarChart3 size={20} />
            보고서
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={20} />
            설정
          </a>
        </nav>
      </div>

      {/* 하단 로그아웃 */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
          <LogOut size={20} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}