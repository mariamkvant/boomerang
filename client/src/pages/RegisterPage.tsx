import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { t } from '../i18n';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupCode = searchParams.get('group');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (groupCode) api.getGroupByInviteCode(groupCode).then(setGroupInfo).catch(() => {});
  }, [groupCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(username, email, password);
      if (groupCode) { try { await api.joinByCode(groupCode); } catch {} }
      navigate('/verify-email');
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#4a9b6f' }}>
      {/* ── Green hero top ── */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-10 pb-6 px-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
            <img src="/logo.svg" alt="Boomerang" className="w-7 h-7" />
          </div>
          <span className="text-white text-xl font-light tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>boomerang</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Register</h1>
        <p className="text-white/70 text-sm text-center max-w-xs">Join your neighbourhood marketplace and start offering or finding services nearby</p>
        {/* Animation */}
        <div className="w-full max-w-[180px] mx-auto mt-2">
          {/* @ts-ignore */}
          <lottie-player
            src="https://assets3.lottiefiles.com/packages/lf20_khzniaya.json"
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: '100%', height: '130px' }}
          />
        </div>
      </div>

      {/* ── White card ── */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl px-6 pt-7 pb-10 shadow-2xl">

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {groupInfo && (
          <div className="bg-[#edf7f1] border border-[#4a9b6f]/30 p-3.5 rounded-2xl mb-4">
            <p className="text-sm font-semibold text-[#1a4731]">Invited to join "{groupInfo.name}"</p>
            <p className="text-xs text-[#4a9b6f] mt-0.5">{groupInfo.member_count} members · by {groupInfo.creator_name}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Username</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4a9b6f] focus:border-transparent transition-all placeholder-gray-300" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4a9b6f] focus:border-transparent transition-all placeholder-gray-300" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4a9b6f] focus:border-transparent transition-all placeholder-gray-300" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5 shrink-0">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" required />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${agreed ? 'border-[#4a9b6f] bg-[#4a9b6f]' : 'border-gray-200 bg-white'}`}>
                {agreed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </div>
            </div>
            <span className="text-xs text-gray-500 leading-relaxed">
              {t('register.agree')}{' '}
              <Link to="/terms" target="_blank" className="text-[#4a9b6f] font-medium hover:underline">{t('register.terms')}</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="text-[#4a9b6f] font-medium hover:underline">{t('register.privacy')}</Link>
            </span>
          </label>

          {/* Sign Up button */}
          <button type="submit" disabled={loading || !agreed}
            className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            style={{ background: '#1a4731' }}>
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account...</>
            ) : (
              <>Sign Up <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></>
            )}
          </button>
        </form>

        {/* Sign in link */}
        <p className="text-center text-sm text-gray-400 mt-5">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-bold text-[#1a4731] hover:underline">{t('login.btn')}</Link>
        </p>
      </div>
    </div>
  );
}
