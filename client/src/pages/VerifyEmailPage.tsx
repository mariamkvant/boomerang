import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.verifyEmail(code);
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const handleResend = async () => {
    try { await api.resendVerify(); setResent(true); setTimeout(() => setResent(false), 5000); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-gray-500 text-sm mt-2">We sent a 6-digit code to <span className="font-medium text-gray-700">{user?.email}</span></p>
      </div>
      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}
      <form onSubmit={handleVerify} className="bg-white p-8 rounded-2xl shadow-card space-y-5">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
          <input id="code" type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="000000" />
        </div>
        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 hover:shadow-md">
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
        <div className="text-center">
          {resent ? <p className="text-sm text-primary-600">Code resent ✓</p>
            : <button type="button" onClick={handleResend} className="text-sm text-gray-500 hover:text-primary-600">Didn't get the code? Resend</button>}
        </div>
      </form>
    </div>
  );
}
