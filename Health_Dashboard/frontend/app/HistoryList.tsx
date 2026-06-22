'use client';
import React from 'react';

// Định nghĩa Props rõ ràng cho TypeScript
interface HistoryTableProps {
  historyData: any[];
  onViewDetail: (record: any) => void;
}

// BẮT BUỘC PHẢI CÓ CỤM TỪ: export default function
export default function HistoryTable({ historyData, onViewDetail }: HistoryTableProps) {
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">Patient Diagnostics History</h3>
      {historyData && historyData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-2">Thời gian</th>
                <th className="py-3 px-2">Thông số (BP/BMI)</th>
                <th className="py-3 px-2">Nhịp tim</th>
                <th className="py-3 px-2">Điểm CVH</th>
                <th className="py-3 px-2 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {historyData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="py-3 px-2">
                    <div>{item.blood_pressure_sys}/{item.blood_pressure_dia} mmHg</div>
                    <div className="text-[10px] text-slate-400 font-normal">BMI: {item.bmi}</div>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${item.hr_color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                      ${item.hr_color === 'orange' ? 'bg-orange-50 text-orange-700 border border-orange-200' : ''}
                      ${item.hr_color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : ''}
                      ${item.hr_color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                    `}>
                      ❤️ {item.extracted_heart_rate} BPM
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-700">{item.overall_cvh_score} Pts</td>
                  <td className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetail(item)}
                      className="px-2.5 py-1 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-md font-bold transition-all text-[11px]"
                    >
                      Xem lại sóng 📊
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-xl">
          Chưa có lịch sử chẩn đoán nào được lưu.
        </div>
      )}
    </div>
  );
}