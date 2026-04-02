import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { useToast } from '../components/Toast';

export default function GroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'browse' | 'mine' | 'create'>('browse');
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', is_public: true });

  const load = () => {
    api.getPublicGroups(groupSearch || undefined).then(setPublicGroups).catch(() => {});
    if (user) api.getMyGroups().then(setMyGroups).catch(() => {});
  };
  useEffect(load, [user, groupSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGroup(form);
      toast('Community created!', 'success');
      setForm({ name: '', description: '', is_public: true });
      load(); setTab('mine');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleJoin = async (id: number) => {
    try { await api.joinGroup(id); toast('Request sent!', 'success'); load(); }
    catch (err: any) { toast(err.message, 'error'); }
  };

  const isMember = (gid: number) => myGroups.some(g => g.id === gid);

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-white">{t('groups.title')}</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl">
        {(['browse', 'mine', 'create'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === tb
                ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tb === 'browse' ? t('groups.browse') : tb === 'mine' ? t('groups.myGroups') : t('groups.create')}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <div>
          <div className="relative mb-5">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder={t('groups.search')}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all"
              aria-label="Search communities" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {publicGroups.map((g: any) => (
              <div key={g.id} className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Thin colored top bar */}
                <div className="h-1 bg-gradient-to-r from-primary-400 to-orange-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/groups/${g.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {g.name}
                      </Link>
                      {g.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{g.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <span>{g.member_count} {t('groups.members')}</span>
                        <span>·</span>
                        <span>by {g.creator_name}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {user && !isMember(g.id) && (
                        <button onClick={() => handleJoin(g.id)}
                          className="text-xs bg-primary-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-primary-600 font-medium transition-colors">
                          {t('groups.join')}
                        </button>
                      )}
                      {isMember(g.id) && (
                        <span className="text-xs text-primary-500 font-medium bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-lg">
                          {t('groups.member')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {publicGroups.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                <p className="text-gray-400 dark:text-gray-500 text-sm">{groupSearch ? t('groups.noResults') : t('groups.noPublic')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Groups tab */}
      {tab === 'mine' && (
        <div className="space-y-2">
          {myGroups.map((g: any) => (
            <Link key={g.id} to={`/groups/${g.id}`}
              className="flex items-center gap-4 bg-white dark:bg-[#202c33] p-4 rounded-xl shadow-sm hover:shadow-md group transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {g.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{g.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{g.member_count} {t('groups.members')} · {g.role}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
          {myGroups.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('groups.noJoined')}</p>
              <button onClick={() => setTab('browse')} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 transition-colors">
                {t('groups.browse')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create tab */}
      {tab === 'create' && user && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-[#202c33] p-6 rounded-2xl shadow-sm space-y-5 max-w-lg">
          <div>
            <label htmlFor="gname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('groups.groupName')}</label>
            <input id="gname" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="e.g. Luxembourg City Helpers"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#2a3942] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
          </div>
          <div>
            <label htmlFor="gdesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('groups.description')}</label>
            <textarea id="gdesc" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={3} placeholder="What's this community about?"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm resize-none bg-white dark:bg-[#2a3942] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
          </div>
          <label className="flex items-center gap-2.5 text-sm dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({...f, is_public: e.target.checked}))} className="rounded" />
            {t('groups.public')}
          </label>
          <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-600 transition-colors">
            {t('groups.createBtn')}
          </button>
        </form>
      )}

      {tab === 'create' && !user && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">Log in to create a community</p>
          <Link to="/login" className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">{t('login')}</Link>
        </div>
      )}
    </div>
  );
}
