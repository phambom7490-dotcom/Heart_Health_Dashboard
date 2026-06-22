'use client';
import Link from 'next/link';

export default function Home() {
  return (
    // Đây là class tạo nền gradient chiếm toàn bộ màn hình
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fcedea] to-[#de3e26] p-6 font-sans">
      
      {/* Đây là khung màu trắng chứa nội dung ở giữa */}
      <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-2xl max-w-2xl w-full border border-white">
        
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-5xl font-black text-[#de3e26] tracking-tight">PCHD</h1>
          <h2 className="text-xl text-slate-600 font-medium">Personal Cardiovascular Health Dashboard</h2>
        </div>

        <p className="text-center text-slate-600 leading-relaxed text-lg mb-10">
          Welcome to the Personal Cardiovascular Health Dashboard. We analyze your 
          ECG/PPG data and calculate your AHA health score to provide timely alerts.
         <br /><br />
          Disclaimer: This tool is for reference only and is not a substitute for 
  professional medical advice. Always consult a doctor.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-3 bg-[#de3e26] text-white font-bold rounded-xl hover:bg-[#c5311b] transition-all shadow-lg shadow-red-900/20 text-center"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-3 bg-white text-[#de3e26] border-2 border-[#de3e26] font-bold rounded-xl hover:bg-red-50 transition-all text-center"
          >
            Sign In
          </Link>
        </div>

        <div className="text-center border-t-2 border-slate-200 pt-8 mt-4">
          <p className="text-sm text-slate-700 font-semibold italic tracking-wide">
            "Every heartbeat is a gift. Don't wait for a warning to appreciate it."
          </p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4 block">
            PCHD Mission
          </span>
        </div>

      </div>
    </div>
  );
}