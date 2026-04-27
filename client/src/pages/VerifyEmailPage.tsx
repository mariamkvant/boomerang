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
      navigate('/onboarding');
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const handleResend = async () => {
    try { await api.resendVerify(); setResent(true); setTimeout(() => setResent(false), 5000); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12 animate-fade-in pb-24 md:pb-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold dark:text-white">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">We sent a 6-digit code to <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email}</span></p>
      </div>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          {error}
        </div>
      )}
      <form onSubmit={handleVerify} className="bg-white dark:bg-[#202c33] p-4 sm:p-8 rounded-2xl shadow-sm space-y-5">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verification Code</label>
          <input id="code" type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold bg-white dark:bg-[#2a3942] dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="000000" autoFocus />
        </div>
        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 hover:shadow-md transition-all">
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
        <div className="text-center">
          {resent ? <p className="text-sm text-primary-600">Code resent successfully</p>
            : <button type="button" onClick={handleResend} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">Didn't get the code? Resend</button>}
        </div>
      </form>
    </div>
  );
}
