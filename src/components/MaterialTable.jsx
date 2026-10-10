import React, { useState } from 'react';

export default function MaterialTable({ materials = [], bomRecipes = [], onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredMaterials = materials.filter(item => {
    if (activeTab === 'materials') return item.category !== '완제품';
    if (activeTab === 'products') return item.category === '완제품';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">자재 및 완제품 목록</h2>
          <p className="text-xs text-slate-400 mt-0.5">실시간 재고 상태 및 완제품 BOM 구성 관리</p>
        </div>

        {/* 미니멀 알약형 탭 */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-500">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'}`}
          >
            전체 {materials.length}
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'materials' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'}`}
          >
            자재류 {materials.filter(m => m.category !== '완제품').length}
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'hover:text-slate-900'}`}
          >
            완제품 {materials.filter(m => m.category === '완제품').length}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">품목명</th>
              <th className="py-3.5 px-6">코드</th>
              <th className="py-3.5 px-6">분류</th>
              <th className="py-3.5 px-6">현재 수량</th>
              <th className="py-3.5 px-6">안전재고 / BOM</th>
              <th className="py-3.5 px-6 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((item) => {
                const isProduct = item.category === '완제품';
                const isShortage = !isProduct && (item.stock ?? 0) < (item.safe_stock ?? 1000);
                const productBoms = isProduct ? bomRecipes.filter(b => b.product_name === item.name) : [];

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{item.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">{item.code || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isProduct ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {isProduct ? (
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-full">
                          조립 생산형
                        </span>
                      ) : (
                        <span className={`font-extrabold text-sm ${isShortage ? 'text-rose-600' : 'text-slate-900'}`}>
                          {(item.stock ?? 0).toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-0.5">개</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isProduct ? (
                        <div className="text-slate-500 max-w-xs truncate" title={productBoms.map(b => `${b.material_name} (${b.quantity_per_unit}개)`).join(', ')}>
                          {productBoms.length > 0 ? (
                            <span><strong className="text-slate-700">BOM:</strong> {productBoms.map(b => `${b.material_name} ${b.quantity_per_unit}개`).join(', ')}</span>
                          ) : (
                            <span className="text-amber-500 font-medium">BOM 미설정</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {(item.safe_stock ?? 1000).toLocaleString()}개
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => onEdit(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => onDelete(item.id, item.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
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