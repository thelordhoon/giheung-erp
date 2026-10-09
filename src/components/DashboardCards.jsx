import React from 'react';

export default function DashboardCards({ materials = [] }) {
  // 재고 부족 품목 필터링 (현재고 < 안전재고)
  const shortageItems = materials.filter(m => (m.stock ?? 0) < (m.safe_stock ?? 1000));

  return (
    <div className="w-full">
      {/* 재고 부족 품목 단독 강조 카드 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">실시간 알림</p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">재고 부족 품목 현황</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${shortageItems.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {shortageItems.length}개
            </span>
            {shortageItems.length > 0 && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200 animate-pulse">
                긴급 발주 필요
              </span>
            )}
          </div>
        </div>

        {/* 하단 대상 품목들을 개별 뱃지 형태로 표시 */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">대상 품목:</span>
            {shortageItems.length > 0 ? (
              shortageItems.map((item, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
                >
                  {item.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">현재 안전재고 미달 품목이 없습니다.</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            안전재고 기준 자동 계산
          </span>
        </div>
      </div>
    </div>
  );
}