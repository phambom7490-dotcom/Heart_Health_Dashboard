'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceArea } from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  
  // State quản lý Tab hiện tại theo mẫu thiết kế
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard' | 'history'>('input');
  
  const [formData, setFormData] = useState({
    age: 25,
    blood_pressure_sys: 120,
    blood_pressure_dia: 80,
    bp_medication: false,
    weight: 65,
    height: 170,
    sleep_hours: 7.5,
    moderate_activity_min: 120,
    vigorous_activity_min: 30,
    nicotine_status: 'never',
    secondhand_smoke: false,
    stress_level: 5,
    non_hdl_cholesterol: '', 
    fbg: '',                
    hba1c: ''                
  });
  
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [showBloodTests, setShowBloodTests] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState<'bpm' | 'ecg'>('bpm');
  const [historyList, setHistoryList] = useState<any[]>([]);

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/history/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHistoryList(res.data);

      // --- PHẦN THÊM MỚI: TỰ ĐỘNG GIỮ LẠI SỐ LIỆU LẦN CUỐI NHẬP ---
      if (res.data && res.data.length > 0) {
        const latest = res.data[0]; // Lấy bản ghi mới nhất ở đầu danh sách
        
        setFormData({
          age: latest.age ?? 25,
          blood_pressure_sys: latest.blood_pressure_sys ?? 120,
          blood_pressure_dia: latest.blood_pressure_dia ?? 80,
          bp_medication: latest.bp_medication ?? false,
          weight: latest.weight ?? 65,
          height: latest.height ?? 170,
          sleep_hours: latest.sleep_hours ?? 7.5,
          moderate_activity_min: latest.moderate_activity_min ?? 120,
          vigorous_activity_min: latest.vigorous_activity_min ?? 30,
          nicotine_status: latest.nicotine_status ?? 'never',
          secondhand_smoke: latest.secondhand_smoke ?? false,
          stress_level: latest.stress_level ?? 5,
          // Nếu lần trước họ không nhập chỉ số máu thì để trống theo mẫu mặc định
          non_hdl_cholesterol: latest.non_hdl_cholesterol ?? '', 
          fbg: latest.fbg ?? '',                
          hba1c: latest.hba1c ?? ''                
        });

        // Tiện ích thêm: Nếu lần trước họ có nhập chỉ số máu nâng cao, 
        // tự động mở rộng (Expand) luôn cái panel xét nghiệm máu ra cho họ thấy
        if (latest.non_hdl_cholesterol || latest.fbg || latest.hba1c) {
          setShowBloodTests(true);
        }
      }
      // -----------------------------------------------------------

    } catch (err) {
      console.error("Failed to load diagnostic history:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchHistory();
    }
  }, [router]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem('token');
    const dataToSend = new FormData();
    
    Object.entries(formData).forEach(([key, val]) => {
      if (['non_hdl_cholesterol', 'fbg', 'hba1c'].includes(key) && !showBloodTests) {
        return; 
      }
      dataToSend.append(key, val.toString());
    });
    if (file) dataToSend.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/evaluate/', dataToSend, {
        headers: { 
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${token}` 
        },
      });
      setResults(res.data);
      setSubmittedData(formData); 
      fetchHistory(); 
      // Tự động chuyển hướng sang tab Dashboard để hiển thị kết quả phân tích trực quan
      setActiveTab('dashboard');
    } catch (err: any) {
      alert(`System Error: ${err.response?.data?.error || 'Unable to connect to Backend Server'}`);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-500 bg-green-50';
    if (score >= 50) return 'text-yellow-600 border-yellow-500 bg-yellow-50';
    return 'text-red-600 border-red-500 bg-red-50';
  };

  const getHrCardStyle = (color: string) => {
    if (!results) return 'bg-white border-slate-100 text-slate-300';
    switch (color) {
      case 'red': return 'bg-red-50 border-red-500 text-red-700 border-2 animate-pulse';
      case 'orange': return 'bg-orange-50 border-orange-400 text-orange-700 border-2';
      case 'yellow': return 'bg-yellow-50 border-yellow-400 text-yellow-700 border-2';
      case 'green': return 'bg-green-50 border-green-400 text-green-700 border-2';
      default: return 'bg-white border-slate-100 text-slate-700';
    }
  };

  const cvhScore = results ? results.overall_cvh_score : 0;
  const gaugeData = [{ value: cvhScore }, { value: 100 - cvhScore }];

  const getGaugeColor = (score: number) => {
    if (score >= 80) return '#10b981'; 
    if (score >= 50) return '#f59e0b'; 
    return '#ef4444';                  
  };

  const activeColor = getGaugeColor(cvhScore);

  const getProcessedChartData = () => {
    if (!results?.chart_data) return [];
    const currentBpm = results.extracted_heart_rate || 70; 
    return results.chart_data.map((item: any) => ({
      ...item,
      BPM_Mapped_Signal: (item.ECG * 15) + currentBpm
    }));
  };

  const processedData = getProcessedChartData();

  const getChartLineColor = () => {
    if (results?.is_emergency) return '#dc2626'; 
    switch (results?.hr_color) {
      case 'red': return '#ef4444'; 
      case 'orange': return '#f97316'; 
      case 'yellow': return '#eab308'; 
      case 'green': return '#10b981'; 
      default: return '#0d9488'; 
    }
  };

  const currentLineColor = getChartLineColor();

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Tạo dữ liệu biểu đồ xu hướng cho màn hình History từ danh sách lịch sử có sẵn
const getTrendData = () => {
    return [...historyList]
      // Sắp xếp tăng dần chuẩn xác theo thời gian thực tế
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) 
      .map((item, index) => ({
        // Gắn thêm _index để chống trùng lặp key 100%
        sessionTime: `${formatDate(item.created_at)}_${index}`, 
        BPM: item.extracted_heart_rate || 70
      }));
  };
  const coachingAlerts = () => {
    if (!results || !submittedData) return { red: [], yellow: [], green: [] };
    
    const alerts: { red: string[], yellow: string[], green: string[] } = { red: [], yellow: [], green: [] };
    const hr = results.extracted_heart_rate || 0;
    const sysBP = Number(submittedData.blood_pressure_sys);
    const diaBP = Number(submittedData.blood_pressure_dia);
    const score = results.overall_cvh_score || 0;

    if (hr > 0 && (hr < 50 || hr > 150)) {
      alerts.red.push("CRITICAL WARNING: Dangerously abnormal resting heart rate detected. Please seek emergency medical assistance immediately.");
    }
    if (sysBP > 180 || diaBP > 110) {
      alerts.red.push("CRITICAL WARNING: Hypertensive crisis detected. Please go to the nearest emergency room immediately.");
    }

    if (hr >= 100 && hr <= 150) {
      alerts.yellow.push("MEDICAL ADVICE: Your resting heart rate is consistently high (Tachycardia). Please schedule an ECG check-up.");
    }
    if ((sysBP >= 130 && sysBP <= 180) || (diaBP >= 80 && diaBP <= 110)) {
      if (!(sysBP > 180 || diaBP > 110)) { 
        alerts.yellow.push("MEDICAL ADVICE: Your blood pressure is elevated. Please consult your doctor for proper evaluation.");
      }
    }
    if (score < 50) {
      alerts.yellow.push("MEDICAL ADVICE: Your Heart Health Score is low. A comprehensive lipid profile is highly recommended.");
    }

    if (Number(submittedData.sleep_hours) < 7) {
      alerts.green.push("LIFESTYLE COACHING: Your heart needs rest. Aim for 7 to 9 hours of quality sleep each night.😴");
    }
    const totalExercise = Number(submittedData.moderate_activity_min) + Number(submittedData.vigorous_activity_min);
    if (totalExercise < 150) {
      alerts.green.push("LIFESTYLE COACHING: Keep moving! Try to reach at least 150 minutes of moderate physical activity per week.🏋️");
    }
    if (['vaping_or_quit_1y', 'traditional'].includes(submittedData.nicotine_status)) {
      alerts.green.push("LIFESTYLE COACHING: Quitting vaping and smoking is the fastest way to reduce pressure on your heart.🚭");
    }
    if (Number(submittedData.stress_level) >= 7) {
      alerts.green.push("LIFESTYLE COACHING: High stress elevates your vitals. Take a moment for deep breathing or meditation.🧘");
    }

    return alerts;
  };

  const alerts = coachingAlerts();
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcedea] to-[#de3e26] text-slate-800 p-4 md:p-6 font-sans flex flex-col md:flex-row gap-6">
      
      {/* ================= SIDEBAR NAVIGATION BAR ================= */}
      <div className="w-full md:w-64 bg-white rounded-2xl p-6 shadow-md flex flex-col justify-between border border-slate-100 shrink-0 md:h-[calc(100vh-3rem)] sticky top-6">
        <div className="space-y-8">
          {/* Brand Logo */}
          <h1 className="text-2xl font-black text-[#de3e26] tracking-wider text-center md:text-left md:px-2">PCHD</h1>
          
          {/* Navigation Items */}
          <nav className="flex flex-row md:flex-col justify-center space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'input'
                  ? 'bg-rose-50 text-[#de3e26] shadow-sm w-full text-center md:text-left'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 w-full text-center md:text-left'
              }`}
            >
              Input Data
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-rose-50 text-[#de3e26] shadow-sm w-full text-center md:text-left'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 w-full text-center md:text-left'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-rose-50 text-[#de3e26] shadow-sm w-full text-center md:text-left'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 w-full text-center md:text-left'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Log Out Button */}
        <button
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="hidden md:block w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-[#de3e26] transition-all mt-auto"
        >
          Log Out
        </button>
      </div>

      {/* ================= MAIN INTERFACE WINDOW ================= */}
      <div className="flex-1 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Banner khẩn cấp */}
        {results?.is_emergency && activeTab === 'dashboard' && (
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="font-bold text-lg">CRITICAL MEDICAL ALERT!</h3>
                <p className="text-xs text-red-100">{results.hr_message}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-red-600 font-bold rounded-lg text-xs uppercase">Emergency</span>
          </div>
        )}

        {/* ---------------- TAB 1: INPUT DATA ---------------- */}
        {activeTab === 'input' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-100 max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back!</h2>
              <p className="text-sm text-slate-400 mt-1">Let&apos;s update your daily cardiovascular vitals.</p>
            </div>
            
            <form onSubmit={handleSubmitEvaluation} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Age</label>
                <input type="number" name="age" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.age} onChange={handleInputChange} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Sys BP (mmHg)</label>
                  <input type="number" name="blood_pressure_sys" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.blood_pressure_sys} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Dia BP (mmHg)</label>
                  <input type="number" name="blood_pressure_dia" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.blood_pressure_dia} onChange={handleInputChange} required />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 py-1">
                <input type="checkbox" name="bp_medication" id="bp_meds" checked={formData.bp_medication} onChange={handleInputChange} className="w-4 h-4 accent-[#de3e26]" />
                <label htmlFor="bp_meds" className="text-xs font-medium text-slate-600">Taking Blood Pressure medications? (-20 Pts)</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Weight (kg)</label>
                  <input type="number" name="weight" step="0.1" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.weight} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Height (cm)</label>
                  <input type="number" name="height" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.height} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Physical Activity - Mod (m/wk)</label>
                  <input type="number" name="moderate_activity_min" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black" value={formData.moderate_activity_min} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Physical Activity - Vig (m/wk)</label>
                  <input type="number" name="vigorous_activity_min" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black" value={formData.vigorous_activity_min} onChange={handleInputChange} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Sleep Duration (Hours)</label>
                <input type="number" name="sleep_hours" step="0.5" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black" value={formData.sleep_hours} onChange={handleInputChange} required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Nicotine Exposure</label>
                <select name="nicotine_status" className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-sm text-black focus:ring-2 focus:ring-[#de3e26] outline-none" value={formData.nicotine_status} onChange={handleInputChange}>
                  <option value="never">Never Smoked/Vaped</option>
                  <option value="quit_5y">Quit ≥ 5 years</option>
                  <option value="quit_1_5y">Quit 1 to &lt; 5 years</option>
                  <option value="vaping_or_quit_1y">Current Vaping or Quit &lt; 1 year</option>
                  <option value="traditional">Current Smoking</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 py-1">
                <input type="checkbox" name="secondhand_smoke" id="secondhand" checked={formData.secondhand_smoke} onChange={handleInputChange} className="w-4 h-4 accent-[#de3e26]" />
                <label htmlFor="secondhand" className="text-xs font-medium text-slate-600">Regular Secondhand Smoke Exposure (-20 Pts)</label>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Psychological Stress (1-10)</label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${formData.stress_level <= 3 ? 'bg-green-100 text-green-700' : formData.stress_level <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>Level {formData.stress_level}</span>
                </div>
                <input type="range" name="stress_level" min="1" max="10" className="w-full accent-[#de3e26] mt-2 cursor-pointer" value={formData.stress_level} onChange={handleInputChange} />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowBloodTests(!showBloodTests)} className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${showBloodTests ? 'bg-rose-50 border-rose-200 text-[#de3e26]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  <span>🔬 Include Lab Blood Panels (Optional)</span>
                  <span>{showBloodTests ? '✕ Close' : '＋ Expand'}</span>
                </button>
              </div>

              {showBloodTests && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-dashed border-rose-200 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">Non-HDL Cholesterol</label>
                    <input type="number" step="0.01" name="non_hdl_cholesterol" placeholder="e.g., 3.4 or 130" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-black" value={formData.non_hdl_cholesterol} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500">Fasting Blood Glucose</label>
                      <input type="number" step="0.01" name="fbg" placeholder="mmol/L" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-black" value={formData.fbg} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500">HbA1c Level (%)</label>
                      <input type="number" step="0.1" name="hba1c" placeholder="%" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-black" value={formData.hba1c} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Upload Wearable Signal (.txt)</label>
                <input type="file" accept=".txt" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-50 file:text-[#de3e26] file:font-bold cursor-pointer" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-[#de3e26] text-white font-bold text-sm rounded-xl hover:bg-[#c9351f] transition-colors shadow-md shadow-rose-900/20">
                {loading ? 'Evaluating Vitals...' : 'Calculate Health Score'}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- TAB 2: DASHBOARD ANALYSIS REPORT ---------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: CVH Gauge Chart */}
              <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 text-center flex flex-col items-center justify-center relative overflow-hidden">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overall CVH Score</p>
                <div className="w-full h-28 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gaugeData} cx="50%" cy="95%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={75} dataKey="value" stroke="none">
                        <Cell fill={results ? activeColor : '#e2e8f0'} />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-1 text-center">
                    <p className="text-3xl font-black tracking-tight" style={{ color: results ? activeColor : '#94a3b8' }}>
                      {results ? cvhScore : '--'}
                    </p>
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wide">Points</p>
                  </div>
                </div>
                {results && (
                  <span className="text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider border mt-2" style={{ backgroundColor: `${activeColor}12`, borderColor: activeColor, color: activeColor }}>
                    {cvhScore >= 80 ? 'Optimal' : cvhScore >= 50 ? 'Moderate' : 'Poor Health'}
                  </span>
                )}
              </div>
              
              {/* Card 2: Heart Rate */}
              <div className={`p-5 rounded-2xl shadow-md border text-center flex flex-col justify-center items-center transition-all duration-300 ${getHrCardStyle(results?.hr_color)}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Resting Heart Rate</p>
                <p className="text-3xl font-black mt-3">
                  {results?.extracted_heart_rate > 0 ? `${results.extracted_heart_rate} BPM` : '--'} 
                </p>
                {results && <span className="text-[10px] mt-2 font-bold uppercase px-2 py-0.5 bg-white/60 rounded border border-current">Normal</span>}
              </div>

              {/* Card 3: BMI */}
              <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 text-center flex flex-col justify-center items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Body Mass Index (BMI)</p>
                <p className="text-3xl font-black mt-3 text-slate-700">{results ? results.bmi : '--'}</p>
                
                {results && results.bmi && (
                  <span className={`text-[10px] mt-2 font-bold px-2 py-0.5 rounded uppercase border ${
                    Number(results.bmi) < 18.5 ? "text-blue-600 bg-blue-50 border-blue-200" :
                    Number(results.bmi) < 25 ? "text-green-600 bg-green-50 border-green-200" :
                    Number(results.bmi) < 30 ? "text-orange-600 bg-orange-50 border-orange-200" :
                    "text-red-600 bg-red-50 border-red-200"
                  }`}>
                    {Number(results.bmi) < 18.5 ? "Underweight" :
                     Number(results.bmi) < 25 ? "Healthy Weight" :
                     Number(results.bmi) < 30 ? "Overweight" : "Obese"}
                  </span>
                )}
              </div>
            </div> {/* <-- ĐÂY CHÍNH LÀ THẺ DIV BỊ THIẾU ĐÃ ĐƯỢC THÊM VÀO */}

            {/* Clinical Commentary */}
            {results && results.hr_message && (
              <div className={`p-5 rounded-xl border-l-4 flex items-start space-x-3 transition-all duration-300
                ${results.hr_color === 'red' ? 'bg-red-50 border-red-500 text-red-900' : ''}
                ${results.hr_color === 'orange' ? 'bg-orange-50 border-orange-400 text-orange-900' : ''}
                ${results.hr_color === 'yellow' ? 'bg-yellow-50 border-yellow-400 text-yellow-900' : ''}
                ${results.hr_color === 'green' ? 'bg-green-50 border-green-400 text-green-900' : ''}
              `}>
                <div className="mt-0.5 text-xl">ℹ️</div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-1 opacity-80">Clinical Commentary</h4>
                  <p className="text-sm font-semibold leading-relaxed">{results.hr_message}</p>
                </div>
              </div>
            )}

            {/* Wearable Signal Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Wearable Signal Analysis</h3>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end">
                  <button type="button" onClick={() => setChartMode('bpm')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartMode === 'bpm' ? 'bg-white text-[#de3e26] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>📈 BPM Mapping</button>
                  <button type="button" onClick={() => setChartMode('ecg')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartMode === 'ecg' ? 'bg-white text-[#de3e26] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>⚡ Raw ECG</button>
                </div>
              </div>

              {results?.chart_data?.length > 0 ? (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis domain={chartMode === 'bpm' ? [0, 200] : ['auto', 'auto']} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      {chartMode === 'bpm' && (
                        <>
                          <ReferenceArea y1={0} y2={50} fill="#ef4444" fillOpacity={0.06} stroke="none" />
                          <ReferenceArea y1={50} y2={60} fill="#f59e0b" fillOpacity={0.06} stroke="none" />
                          <ReferenceArea y1={60} y2={100} fill="#10b981" fillOpacity={0.06} stroke="none" />
                          <ReferenceArea y1={100} y2={150} fill="#f59e0b" fillOpacity={0.06} stroke="none" />
                          <ReferenceArea y1={150} y2={200} fill="#ef4444" fillOpacity={0.06} stroke="none" />
                        </>
                      )}
                      <Line type="monotone" dataKey={chartMode === 'bpm' ? "BPM_Mapped_Signal" : "ECG"} stroke={currentLineColor} dot={false} strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-slate-400 text-xs bg-slate-50/50">
                  <span>No active waveform analysis loaded.</span>
                  <button onClick={() => setActiveTab('input')} className="mt-2 font-bold text-[#de3e26] hover:underline">Go to Input Data to process a file</button>
                </div>
              )}
            </div>

            {/* Advice and Target HR Zones */}
            {results && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">Health Assessment & Advice</h4>
                  
                  {alerts.red.length === 0 && alerts.yellow.length === 0 && alerts.green.length === 0 && (
                    <div className="p-4 rounded-xl bg-green-50 text-green-800 text-xs font-medium">Great job! Your current cardiovascular health metrics are well managed. Maintain this lifestyle.</div>
                  )}
                  {alerts.red.map((msg, idx) => (
                    <div key={`red-${idx}`} className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-semibold flex items-start space-x-2">
                      <span>🚨</span> <p>{msg}</p>
                    </div>
                  ))}
                  {alerts.yellow.map((msg, idx) => (
                    <div key={`yellow-${idx}`} className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start space-x-2">
                      <span>⚠️</span> <p>{msg}</p>
                    </div>
                  ))}
                  {alerts.green.map((msg, idx) => (
                    <div key={`green-${idx}`} className="p-4 rounded-xl bg-teal-50 border border-teal-300 text-teal-900 text-xs font-semibold flex items-start space-x-2">
                      <span>🌱</span> <p>{msg}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Target HR Zones</h4>
                  <div className="space-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between border-b pb-1.5"><span className="text-slate-400">Max HR:</span><span className="font-bold text-slate-800">{results.max_hr} BPM</span></div>
                    <div className="flex justify-between border-b pb-1.5"><span className="text-slate-400">Moderate Zone:</span><span className="font-bold text-amber-600">{results.target_mod}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Vigorous Zone:</span><span className="font-bold text-red-600">{results.target_vig}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: DIAGNOSTICS HISTORY ---------------- */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Heart Rate Trends (Last 30 Days)</h3>
              {historyList.length > 0 ? (
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                      
                      {/* 1. XAxis: Cắt bỏ _index và cắt bỏ giờ, chỉ lấy ngày hiển thị dưới trục X */}
                      <XAxis 
                        dataKey="sessionTime" 
                        tickFormatter={(value) => value ? String(value).split('_')[0].split(',')[0] : ''} 
                        tick={{ fontSize: 10 }} 
                      />
                      
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                      
                      {/* 2. Tooltip: Cắt bỏ _index để hiển thị đầy đủ (Ngày + Giờ) trong bảng thông tin */}
                      <Tooltip 
                        shared={false} 
                        labelFormatter={(value) => value ? String(value).split('_')[0] : ''}
                      />
                      
                      <Line 
                        type="monotone" 
                        dataKey="BPM" 
                        stroke="#de3e26" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 6, fill: '#de3e26', stroke: '#fff', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">No data points available for trends.</div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Diagnostic Records Log</h3>
              {historyList && historyList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-2">Timestamp</th>
                        <th className="py-3 px-2">Metrics (BP/BMI)</th>
                        <th className="py-3 px-2">Heart Rate</th>
                        <th className="py-3 px-2">CVH Score</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                      {historyList.map((item: any, index: number) => (
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
                            `}>❤️ {item.extracted_heart_rate} BPM</span>
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-700">{item.overall_cvh_score} Pts</td>
                          <td className="py-3 px-2 text-right">
                            <button 
                              type="button" 
                              onClick={() => { 
                                setResults(item);
                                setSubmittedData(item); 
                                setActiveTab('dashboard'); 
                              }} 
                              className="px-3 py-1.5 bg-rose-50 text-[#de3e26] hover:bg-rose-100 rounded-lg font-bold transition-all text-[11px]"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-xl">No diagnostic history found in records.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}