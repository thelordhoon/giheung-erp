import React from 'react';

export default function StockLogTable({ logs, onDeleteLog }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">최근 입출고 내역</h2>
          <p className="text-xs text-slate-500 mt-0.5">실시간 자재 입고 및 출고 처리 기록입니다. (최대 15개 표시)</p>
        </div>
      </div>

      <div className="max-h-[450px] overflow-y-auto">
        {/* 모바일 화면용 리스트 카드 */}
        <div className="block md:hidden divide-y divide-slate-100">
          {logs && logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={log.id || index} className="p-4 space-y-1.5 hover:bg-slate-50 transition">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{log.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{log.ref}</span>
                    <button 
                      onClick={() => onDeleteLog(log.id)}
                      className="text-slate-300 hover:text-red-600 transition p-1 cursor-pointer"
                      title="내역 삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      log.type.includes('입고') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {log.type}
                    </span>
                    <span className="font-medium text-sm text-slate-900">{log.material_name}</span>
                  </div>
                  <span className={`font-bold text-sm ${String(log.quantity).startsWith('+') ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {log.quantity}
                  </span>
                </div>
                <div className="flex justify-end text-xs text-slate-500 pt-1">
                  잔여 재고: <span className="font-semibold text-slate-700 ml-1">{log.remaining}개</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">입출고 내역이 없습니다.</div>
          )}
        </div>

        {/* PC 화면용 테이블 */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-6 font-semibold">날짜</th>
              <th className="py-3 px-6 font-semibold">구분</th>
              <th className="py-3 px-6 font-semibold">자재명</th>
              <th className="py-3 px-6 font-semibold">수량</th>
              <th className="py-3 px-6 font-semibold">잔여 재고</th>
              <th className="py-3 px-6 font-semibold">참조 번호</th>
              <th className="py-3 px-6 font-semibold">상태</th>
              <th className="py-3 px-6 font-semibold text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {logs && logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">{log.date}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.type.includes('입고') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900">{log.material_name}</td>
                  <td className={`py-4 px-6 font-semibold ${String(log.quantity).startsWith('+') ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {log.quantity}
                  </td>
                  <td className="py-4 px-6 text-slate-600">{log.remaining}</td>
                  <td className="py-4 px-6 text-slate-500 font-mono text-xs">{log.ref}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {log.status || '완료'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => onDeleteLog(log.id)}
                      className="text-slate-300 hover:text-red-600 transition p-1 cursor-pointer"
                      title="내역 삭제"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="py-8 text-center text-slate-400">입출고 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}