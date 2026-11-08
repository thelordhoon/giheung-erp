import React, { useState } from 'react';

export default function MaterialTable({ materials = [], bomRecipes = [], onEdit, onDelete }) {
  const [selectedTab, setSelectedTab] = useState('자재');

  // 탭에 따른 필터링 및 분류별 정렬 (모듈 -> 전원장치 -> 부자재 순서로 정렬)
  const categoryOrder = { '모듈': 1, '전원장치': 2, '부자재': 3 };

  const filteredMaterials = materials.filter(m => {
    if (selectedTab === '자재') {
      return m.category === '모듈' || m.category === '전원장치' || m.category === '부자재';
    } else {
      return m.category === '완제품';
    }
  }).sort((a, b) => {
    if (selectedTab === '자재') {
      return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
    }
    return 0;
  });

  const materialCount = materials.filter(m => m.category === '모듈' || m.category === '전원장치' || m.category === '부자재').length;
  const finishedCount = materials.filter(m => m.category === '완제품').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">자재 및 완제품 재고 목록</h2>
          <p className="text-xs text-slate-400 mt-0.5">품목 현황 및 안전재고 모니터링</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setSelectedTab('자재')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === '자재' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            자재 및 부자재 <span className="ml-1 text-[10px] text-slate-400">({materialCount})</span>
          </button>
          
          <button
            onClick={() => setSelectedTab('완제품')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === '완제품' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            완제품 <span className="ml-1 text-[10px] text-slate-400">({finishedCount})</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-2xs z-10">
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">분류</th>
              <th className="py-3.5 px-6">품목명</th>
              <th className="py-3.5 px-6">품목코드 (SKU)</th>
              <th className="py-3.5 px-6">현재고 / 안전재고</th>
              <th className="py-3.5 px-6">구성 레시피 (BOM) / 상태</th>
              <th className="py-3.5 px-6 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((item) => {
                const isFinished = item.category === '완제품';
                const stock = item.stock ?? 0;
                const safeStock = item.safe_stock ?? 1000;
                const isShortage = !isFinished && stock < safeStock;

                const itemBoms = isFinished 
                  ? bomRecipes.filter(b => b.product_name === item.name)
                  : [];

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isFinished ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">{item.code || '-'}</td>
                    <td className="py-3.5 px-6">
                      {isFinished ? (
                        <span className="text-slate-400 font-medium">-</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold ${isShortage ? 'text-rose-600 text-sm' : 'text-slate-800'}`}>
                            {stock.toLocaleString()}개
                          </span>
                          <span className="text-slate-400 text-[11px] font-medium">
                            (안전: {safeStock.toLocaleString()})
                          </span>
                          {isShortage && (
                            <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                              발주필요
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {isFinished ? (
                        <div className="flex flex-wrap gap-1">
                          {itemBoms.length > 0 ? (
                            itemBoms.map((bom, idx) => (
                              <span key={idx} className="bg-indigo-50/70 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                                {bom.material_name} <strong className="text-indigo-900">{bom.quantity_per_unit}개</strong>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">등록된 BOM 없음</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button 
                        onClick={() => onEdit(item)}
                        className="text-slate-400 hover:text-indigo-600 font-semibold transition cursor-pointer"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => onDelete(item.id, item.name)}
                        className="text-slate-400 hover:text-rose-600 font-semibold transition cursor-pointer"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 font-medium">
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}