import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (q: string, city: string, lang: string) => {
    setLoading(true);
    try {
      let people = await api.searchPeople(q.trim() || '');
      if (city) people = people.filter((u: any) => u.city?.toLowerCase().includes(city.toLowerCase()));
      if (lang) people = people.filter((u: any) => u.languages_spoken?.toLowerCase().includes(lang.toLowerCase()));
      setResults(people);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { search('', '', ''); }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query, cityFilter, langFilter), 300);
    return () => clearTimeout(t);
  }, [query, cityFilter, langFilter]);

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-1 dark:text-white">Find People</h2>
      <p className="text-gray-500 text-sm mb-5">Search by name, skill, city, or language</p>

      {/* Search + filters */}
      <div className="space-y-2 mb-6">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Name, skill, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <input value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              placeholder="City..."
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
          </div>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
            </svg>
            <input value={langFilter} onChange={e => setLangFilter(e.target.value)}
              placeholder="Language..."
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-400 text-sm">Searching...</div>}

      {!loading && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">👥</div>
          <p className="text-gray-400 text-sm">No people found matching your filters</p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((u: any) => (
          <Link key={u.id} to={`/users/${u.id}`}
            className="flex items-center gap-3 bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 group transition-all">
            {u.avatar ? (
              <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {u.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm dark:text-white group-hover:text-primary-600 transition-colors">{u.username}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                {u.city && <span>📍 {u.city}</span>}
                {u.languages_spoken && <span>🗣 {u.languages_spoken}</span>}
                <span>🪃 {u.points}</span>
              </div>
              {u.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{u.bio}</p>}
            </div>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
