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

      {/* 모바일 화면에서는 카드형태로, PC에서는 테이블 형태로 전환 */}
      <div className="block md:hidden divide-y divide-slate-100">
        {materials && materials.length > 0 ? (
          materials.map((item) => {
            const currentStock = item.stock ?? 0;
            const safeStock = item.safe_stock ?? item.safeStock ?? 1000;
            const isShortage = currentStock < safeStock;

            return (
              <div key={item.id} className="p-4 space-y-2 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{item.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{item.code || item.sku}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      title="수정"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDelete(item.id, item.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">현재 수량</span>
                    <span className="font-bold text-slate-900 text-base">{currentStock.toLocaleString()}개</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">안전재고</span>
                    <span className="text-slate-600">{safeStock.toLocaleString()}개</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isShortage ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {isShortage ? '재고 부족' : '재고 충분'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">등록된 자재 데이터가 없습니다.</div>
        )}
      </div>

      {/* PC 화면용 테이블 */}
      <div className="hidden md:block overflow-x-auto">
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
                    <td className="py-4 px-6 font-semibold text-slate-900">{currentStock.toLocaleString()}개</td>
                    <td className="py-4 px-6 text-slate-500">{safeStock.toLocaleString()}개</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        isShortage ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {isShortage ? '재고 부족' : '재고 충분'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer" title="수정">✏️</button>
                      <button onClick={() => onDelete(item.id, item.name)} className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer" title="삭제">🗑️</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7" className="py-8 text-center text-slate-400">등록된 자재 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}