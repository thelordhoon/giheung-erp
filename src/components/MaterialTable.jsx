import React from 'react';

export default function MaterialTable({ materials, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">현재 자재 재고 목록</h2>
          <p className="text-xs text-slate-500 mt-0.5">실시간 자재 및 완제품 재고 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-6 font-semibold">자재명</th>
              <th className="py-3 px-6 font-semibold">품목코드(SKU)</th>
              <th className="py-3 px-6 font-semibold">분류</th>
              <th className="py-3 px-6 font-semibold">현재 수량</th>
              <th className="py-3 px-6 font-semibold">안전재고</th>
              <th className="py-3 px-6 font-semibold">상태</th>
              <th className="py-3 px-6 font-semibold text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {materials && materials.length > 0 ? (
              materials.map((item) => {
                const currentStock = item.stock ?? 0;
                const safeStock = item.safe_stock ?? item.safeStock ?? 1000;
                const isShortage = currentStock < safeStock;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-medium text-slate-900">{item.name}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{item.code || item.sku}</td>
                    <td className="py-4 px-6 text-slate-600">{item.category}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {currentStock.toLocaleString()}개
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {safeStock.toLocaleString()}개
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        isShortage 
                          ? 'bg-red-50 text-red-600 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {isShortage ? '재고 부족' : '재고 충분'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => onEdit(item)}
                        className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer"
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(item.id, item.name)}
                        className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  등록된 자재 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}