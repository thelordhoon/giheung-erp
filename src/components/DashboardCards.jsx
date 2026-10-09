import React from 'react';

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* 1. 총 재고 가치 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">표시하고 싶은신거</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">-</h3>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          📦
        </div>
      </div>

      {/* 2. 재고 부족 품목 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">재고 부족 품목</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">-</h3>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
          ⚠️
        </div>
      </div>

      {/* 3. 출고 대기 건수 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">표시 하고 싶으신거 2</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">-</h3>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          ⏳
        </div>
      </div>

      {/* 4. 전체 재고 수량 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">그냥 지워 버릴까요?</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">-</h3>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          📊
        </div>
      </div>
    </div>
  );
}