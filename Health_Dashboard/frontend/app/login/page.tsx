'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
      localStorage.setItem('token', res.data.access);
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid username or password!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#fcedea] to-[#de3e26] font-sans">
      <div className="flex flex-col md:flex-row items-center justify-center gap-16 max-w-4xl w-full">
        {/* BÊN TRÁI: Logo CSS thay thế tạm thời & Tiêu đề */}
        <div className="hidden md:flex flex-col items-center text-center space-y-6">
          <div className="w-48 h-48 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/50 shadow-2xl">
            <span className="text-6xl font-black text-white tracking-tighter">PCHD</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-md">PCHD Analytics</h1>
            <p className="text-white/90 font-medium mt-2">Advanced Cardiovascular Monitoring</p>
          </div>
        </div>

        {/* BÊN PHẢI: Form */}
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl flex flex-col">
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">← Back to Home</Link>
          <h2 className="text-3xl font-extrabold text-center text-blue-600 mb-6">Sign In</h2>
          
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && <p className="text-red-500 text-sm text-center font-semibold bg-red-50 p-2 rounded">{error}</p>}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Username</label>
              <input type="text" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-gray-50" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input type="password" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-gray-50" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 mt-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign up here</Link>
          </p>

          <div className="mt-8 pt-6 border-t-2 border-gray-300 text-center space-y-2">
  <p className="text-sm italic font-semibold text-gray-700 leading-relaxed">
    "Every heartbeat is a gift. Don't wait for a warning to appreciate it."
  </p>
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
    PCHD Mission
  </p>
</div>
        </div>
      </div>
    </div>
  );
}