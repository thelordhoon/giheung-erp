import React from 'react';

export default function DashboardCards({ materials = [] }) {
  // 완제품은 제외하고, 자재 및 부자재 중에서 현재고가 안전재고 미만인 품목만 추출
  const shortageItems = materials.filter(m => 
    m.category !== '완제품' && (m.stock ?? 0) < (m.safe_stock ?? 1000)
  );

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Real-time Alert
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">재고 부족 품목 현황</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-3xl font-black ${shortageItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {shortageItems.length}<span className="text-sm font-medium text-slate-400 ml-0.5">개</span>
            </span>
            {shortageItems.length > 0 && (
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-200/60 animate-pulse">
                긴급 발주 필요
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">부족 자재:</span>
            {shortageItems.length > 0 ? (
              shortageItems.map((item, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs"
                >
                  {item.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 font-medium">현재 안전재고 미달 품목이 없습니다.</span>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-300">
            자재류 안전재고 기준 자동 집계
          </span>
        </div>
      </div>
    </div>
  );
}