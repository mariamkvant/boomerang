import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const people = await api.searchPeople(query.trim());
    setResults(people);
    setSearched(true);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Find People</h2>
      <p className="text-gray-500 text-sm mb-6">Search by name, city, language, or skill</p>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Portuguese, Luxembourg-Ville, guitar..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-card" />
        </div>
        <button onClick={handleSearch} className="bg-primary-500 text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-primary-600">Search</button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-12">No people found matching "{query}"</p>
      )}

      <div className="space-y-3">
        {results.map((u: any) => (
          <Link key={u.id} to={`/users/${u.id}`} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover group">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
              {u.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm group-hover:text-primary-600">{u.username}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                {u.city && <span>📍 {u.city}</span>}
                {u.languages_spoken && <span>🗣️ {u.languages_spoken}</span>}
                <span>🪃 {u.points} pts</span>
              </div>
              {u.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{u.bio}</p>}
            </div>
            <span className="text-gray-300 group-hover:text-primary-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
