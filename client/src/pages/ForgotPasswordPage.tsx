import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await api.forgotPassword(email); setStep('code'); }
    catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await api.resetPassword({ email, code, newPassword }); setStep('done'); }
    catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12 animate-fade-in pb-24 md:pb-8">
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{step === 'done' ? 'Password Reset' : 'Forgot Password'}</h2>
      </div>
      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="bg-white p-4 sm:p-8 rounded-2xl shadow-card space-y-5">
          <p className="text-sm text-gray-500">Enter your email and we'll send you a reset code.</p>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
          <p className="text-center text-sm"><Link to="/login" className="text-primary-600 hover:underline">Back to login</Link></p>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleReset} className="bg-white p-4 sm:p-8 rounded-2xl shadow-card space-y-5">
          <p className="text-sm text-gray-500">Check your email for the 6-digit code.</p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">Reset Code</label>
            <input id="code" type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="000000" />
          </div>
          <div>
            <label htmlFor="newpw" className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input id="newpw" type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-card text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="font-semibold text-gray-900 mb-2">Password reset successful</p>
          <p className="text-sm text-gray-500 mb-6">You can now log in with your new password.</p>
          <Link to="/login" className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-600">Go to Login</Link>
        </div>
      )}
    </div>
  );
}
