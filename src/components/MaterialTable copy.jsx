import React, { useState } from 'react';

export default function MaterialTable({ materials = [], bomRecipes = [], onEdit, onDelete }) {
  // 탭 상태 ('all' | 'materials' | 'products')
  const [activeTab, setActiveTab] = useState('all');

  // 탭에 따른 필터링
  const filteredMaterials = materials.filter(item => {
    if (activeTab === 'materials') return item.category !== '완제품';
    if (activeTab === 'products') return item.category === '완제품';
    return true; // 'all'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 카드 헤더 및 탭 버튼 */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">현재 자재 및 완제품 재고 목록</h2>
          <p className="text-xs text-slate-500 mt-0.5">실시간 품목 현황 및 BOM 레시피 연동 관리</p>
        </div>

        {/* 분류별 탭 버튼 */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            전체 ({materials.length})
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'materials' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            자재 및 부자재 ({materials.filter(m => m.category !== '완제품').length})
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            완제품 ({materials.filter(m => m.category === '완제품').length})
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">품목명</th>
              <th className="py-3 px-4">품목코드(SKU)</th>
              <th className="py-3 px-4">분류</th>
              <th className="py-3 px-4">현재 수량 / 상태</th>
              <th className="py-3 px-4">안전재고 / BOM 구성</th>
              <th className="py-3 px-4 text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((item) => {
                const isProduct = item.category === '완제품';
                const isShortage = !isProduct && (item.stock ?? 0) < (item.safe_stock ?? 1000);
                
                // 완제품인 경우 연결된 BOM 레시피 찾기
                const productBoms = isProduct ? bomRecipes.filter(b => b.product_name === item.name) : [];

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {item.code || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isProduct ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isProduct ? (
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50/60 px-2 py-1 rounded">
                          조립 생산 대기형
                        </span>
                      ) : (
                        <span className={`font-bold ${isShortage ? 'text-red-600' : 'text-slate-900'}`}>
                          {(item.stock ?? 0).toLocaleString()}개
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isProduct ? (
                        <div className="text-xs text-slate-600 max-w-xs truncate" title={productBoms.map(b => `${b.material_name} (${b.quantity_per_unit}개)`).join(', ')}>
                          {productBoms.length > 0 ? (
                            <span>
                              <strong className="text-slate-700">구성:</strong> {productBoms.map(b => `${b.material_name} ${b.quantity_per_unit}개`).join(', ')}
                            </span>
                          ) : (
                            <span className="text-amber-500">BOM 미설정</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">
                          {(item.safe_stock ?? 1000).toLocaleString()}개
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEdit(item)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => onDelete(item.id, item.name)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
                <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
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