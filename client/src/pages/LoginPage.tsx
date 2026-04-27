import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12 animate-fade-in pb-24 md:pb-8">
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{t('login.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('login.subtitle')}</p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-2xl shadow-card space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.email')}</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.password')}</label>
          <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md">
          {loading ? 'Logging in...' : t('login.btn')}
        </button>
        <p className="text-center text-sm text-gray-500">{t('login.noAccount')} <Link to="/register" className="text-primary-600 font-medium hover:underline">{t('login.signupFree')}</Link></p>
        <p className="text-center text-sm"><Link to="/forgot-password" className="text-gray-400 hover:text-primary-600">{t('login.forgot')}</Link></p>
      </form>
    </div>
  );
}
