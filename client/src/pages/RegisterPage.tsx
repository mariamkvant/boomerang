import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register(username, email, password); navigate('/dashboard'); }
    catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in">
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Join Boomerang</h2>
        <p className="text-gray-500 text-sm mt-1">Create your account and start with <span className="font-semibold text-primary-600">50 free points</span></p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Choose a username" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="At least 6 characters" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Log in</Link></p>
      </form>
      <div className="mt-6 text-center text-xs text-gray-400">
        🪃 What you give comes back to you
      </div>
    </div>
  );
}
