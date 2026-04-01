import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { t } from '../i18n';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function groupByDate(messages: any[]) {
  const groups: { date: string; msgs: any[] }[] = [];
  let lastDate = '';
  for (const m of messages) {
    const date = formatDate(m.created_at);
    if (date !== lastDate) { groups.push({ date, msgs: [m] }); lastDate = date; }
    else { groups[groups.length - 1].msgs.push(m); }
  }
  return groups;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [convos, setConvos] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<number | null>(Number(searchParams.get('to')) || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api.getConversations().then(setConvos).catch(() => {}); }, []);

  useEffect(() => {
    if (activeUser) {
      api.getDMs(activeUser).then(setMessages).catch(() => {});
      const i = setInterval(() => { api.getDMs(activeUser).then(setMessages).catch(() => {}); }, 5000);
      return () => clearInterval(i);
    }
  }, [activeUser]);

  useSocket('dm', (data) => {
    if (activeUser && (data.sender_id === activeUser || data.receiver_id === activeUser)) {
      setMessages((prev) => {
        if (prev.some((m: any) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
    api.getConversations().then(setConvos).catch(() => {});
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (activeUser) inputRef.current?.focus(); }, [activeUser]);

  const send = async () => {
    if (!newMsg.trim() || !activeUser) return;
    setSending(true);
    const msgText = newMsg.trim();
    const optimistic = { id: Date.now(), sender_id: user?.id, receiver_id: activeUser, body: msgText, created_at: new Date().toISOString(), _optimistic: true };
    setMessages((prev) => [...prev, optimistic]);
    setNewMsg('');
    try {
      const result = await api.sendDM(activeUser, msgText);
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...optimistic, id: result.id, _optimistic: false } : m));
      api.getConversations().then(setConvos).catch(() => {});
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const activeConvo = convos.find(c => c.id === activeUser);
  const [activeUserInfo, setActiveUserInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeUser && !convos.find(c => c.id === activeUser)) {
      api.getUser(activeUser).then(setActiveUserInfo).catch(() => {});
    } else { setActiveUserInfo(null); }
  }, [activeUser, convos]);

  const activeName = activeConvo?.username || activeUserInfo?.username || 'User';
  const showChat = activeUser !== null;

  const searchPeople = async (q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) {
      const results = await api.searchPeople(q);
      setSearchResults(results.filter((u: any) => u.id !== user?.id));
    } else { setSearchResults([]); }
  };

  const messageGroups = groupByDate(messages);

  return (
    <div className="animate-fade-in">
      <div className="flex gap-0 md:gap-4 h-[calc(100vh-180px)] min-h-[400px]">
        {/* Conversation list */}
        <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 flex-col bg-white rounded-2xl shadow-card overflow-hidden`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold mb-3">{t('messages.title')}</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={searchQuery} onChange={e => searchPeople(e.target.value)} placeholder="Search people..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="border-b border-gray-100">
              {searchResults.slice(0, 5).map((u: any) => (
                <button key={u.id} onClick={() => { setActiveUser(u.id); setSearchQuery(''); setSearchResults([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 text-left">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">{u.username?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium">{u.username}</p>
                    {u.city && <p className="text-xs text-gray-400">{u.city}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 && !searchQuery && (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No conversations yet</p>
                <p className="text-xs text-gray-300 mt-1">Search for someone to start chatting</p>
              </div>
            )}
            {convos.map((c: any) => (
              <button key={c.id} onClick={() => setActiveUser(c.id)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 flex items-center gap-3 ${activeUser === c.id ? 'bg-primary-50' : ''}`}>
                <div className="relative shrink-0">
                  <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{c.username?.charAt(0).toUpperCase()}</div>
                  {c.unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">{c.unread}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{c.username}</span>
                    <span className="text-[10px] text-gray-300 shrink-0 ml-2">{formatDate(c.last_message_at || c.created_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>{c.last_message}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-2xl shadow-card flex-col overflow-hidden`}>
          {!activeUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-3">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Select a conversation to start</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveUser(null)} className="md:hidden p-1 -ml-1 text-gray-400 hover:text-gray-600" aria-label="Back">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{activeName.charAt(0).toUpperCase()}</div>
                  <Link to={`/users/${activeUser}`} className="text-sm font-semibold hover:text-primary-600">{activeName}</Link>
                </div>
              </div>

              {/* Messages with date groups */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-300">Send a message to start the conversation</p>
                  </div>
                )}
                {messageGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{group.date}</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.msgs.map((m: any) => {
                        const isMine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                              isMine
                                ? 'bg-primary-500 text-white rounded-2xl rounded-br-lg'
                                : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-lg'
                            } ${m._optimistic ? 'opacity-70' : ''}`}>
                              <div>{m.body}</div>
                              <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'text-primary-200 justify-end' : 'text-gray-400'}`}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMine && m._optimistic && <span>○</span>}
                                {isMine && !m._optimistic && <span>✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
                <div className="flex gap-2 items-end">
                  <input ref={inputRef} value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 bg-gray-50 border-0 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                  <button onClick={send} disabled={sending || !newMsg.trim()}
                    className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
