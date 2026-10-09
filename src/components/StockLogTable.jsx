import React from 'react';

export default function StockLogTable({ logs }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">최근 입출고 내역</h2>
          <p className="text-xs text-slate-500 mt-0.5">실시간 자재 입고 및 출고 처리 기록입니다.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-6 font-semibold">날짜</th>
              <th className="py-3 px-6 font-semibold">구분</th>
              <th className="py-3 px-6 font-semibold">자재명</th>
              <th className="py-3 px-6 font-semibold">수량</th>
              <th className="py-3 px-6 font-semibold">잔여 재고</th>
              <th className="py-3 px-6 font-semibold">참조 번호</th>
              <th className="py-3 px-6 font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {logs && logs.length > 0 ? (
              logs.map((log) => {
                const isIncoming = log.type === '입고' || log.type === 'IN';
                // 다양한 컬럼명 대응
                const materialName = log.material_name || log.materialName || log.name || '자재명 없음';
                const refNo = log.ref || log.ref_no || log.reference || '-';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 text-slate-500">{log.date}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        isIncoming 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">{materialName}</td>
                    <td className={`py-4 px-6 font-semibold ${isIncoming ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {log.quantity}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{log.remaining}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{refNo}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {log.status || '완료'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  입출고 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}