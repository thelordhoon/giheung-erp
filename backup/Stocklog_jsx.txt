import React from 'react';

export default function StockLogTable({ logs = [], onDeleteLog }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">최근 입출고 내역</h2>
          <p className="text-xs text-slate-400 mt-0.5">실시간 자재 변동 및 완제품 생산 이력</p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          총 {logs.length}건
        </span>
      </div>

      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-2xs z-10">
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">일자</th>
              <th className="py-3.5 px-6">구분</th>
              <th className="py-3.5 px-6">품목명</th>
              <th className="py-3.5 px-6">변동 수량</th>
              <th className="py-3.5 px-6">최종 재고</th>
              <th className="py-3.5 px-6">참조 (Ref)</th>
              <th className="py-3.5 px-6 text-right">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {logs.length > 0 ? (
              logs.map((log) => {
                const isInbound = log.type === '입고';
                const isFinishedOut = log.type === '출고(완제품)';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{log.date}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isInbound 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : isFinishedOut 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{log.material_name}</td>
                    <td className={`py-3.5 px-6 font-extrabold ${isInbound ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.quantity}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">{log.remaining}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">{log.ref}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button 
                        onClick={() => onDeleteLog(log.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition cursor-pointer"
                        title="내역 삭제"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400 font-medium">
                  입출고 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}