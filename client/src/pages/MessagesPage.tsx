import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket, sendWsMessage } from '../hooks/useSocket';
import { t } from '../i18n';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingSentRef = useRef(0);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

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
      setMessages((prev) => prev.some((m: any) => m.id === data.id) ? prev : [...prev, data]);
    }
    api.getConversations().then(setConvos).catch(() => {});
  });

  useSocket('typing', (data) => {
    if (data.sender_id === activeUser) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    }
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (activeUser) inputRef.current?.focus(); }, [activeUser]);

  const emitTyping = () => {
    if (!activeUser) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      sendWsMessage({ type: 'typing', to: activeUser });
      lastTypingSentRef.current = now;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB raw limit
    // Compress image using canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 1200;
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      setPendingImage(compressed);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const send = async () => {
    if ((!newMsg.trim() && !pendingImage) || !activeUser) return;
    setSending(true);
    const msgText = newMsg.trim();
    const imgToSend = pendingImage;
    const optimistic = { id: Date.now(), sender_id: user?.id, receiver_id: activeUser, body: msgText, image: imgToSend, created_at: new Date().toISOString(), _optimistic: true };
    setMessages((prev) => [...prev, optimistic]);
    setNewMsg(''); setPendingImage(null);
    try {
      const result = await api.sendDM(activeUser, msgText, imgToSend || undefined);
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...optimistic, id: result.id, _optimistic: false } : m));
      api.getConversations().then(setConvos).catch(() => {});
    } catch { setMessages((prev) => prev.filter((m) => m.id !== optimistic.id)); }
    setSending(false);
    inputRef.current?.focus();
  };

  const activeConvo = convos.find(c => c.id === activeUser);
  const [activeUserInfo, setActiveUserInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeUser && !convos.find(c => c.id === activeUser)) api.getUser(activeUser).then(setActiveUserInfo).catch(() => {});
    else setActiveUserInfo(null);
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
    <div className="animate-fade-in -mx-4 -mt-6" style={{ height: 'calc(100dvh - 128px)' }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] shrink-0 flex-col bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-[#2a3942]`}>
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('messages.title')}</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={searchQuery} onChange={e => searchPeople(e.target.value)} placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:bg-white outline-none" />
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border-b border-gray-100">
              {searchResults.slice(0, 5).map((u: any) => (
                <button key={u.id} onClick={() => { setActiveUser(u.id); setSearchQuery(''); setSearchResults([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">{u.username?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-[15px] font-medium text-gray-900">{u.username}</p>
                    {u.city && <p className="text-xs text-gray-500">{u.city}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 && !searchQuery && (
              <div className="text-center py-20 px-6">
                <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-300 text-xs mt-1">Search for someone to start chatting</p>
              </div>
            )}
            {convos.map((c: any) => (
              <button key={c.id} onClick={() => setActiveUser(c.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 ${activeUser === c.id ? 'bg-primary-50' : ''}`}>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">{c.username?.charAt(0).toUpperCase()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[15px] truncate ${c.unread > 0 ? 'font-semibold text-gray-900' : 'font-normal text-gray-900'}`}>{c.username}</span>
                    <span className={`text-[11px] shrink-0 ml-2 ${c.unread > 0 ? 'text-primary-500 font-medium' : 'text-gray-400'}`}>{formatTime(c.last_at) || formatDate(c.last_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{c.last_message || 'Start chatting'}</p>
                    {c.unread > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold shrink-0 ml-2">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden`}>
          {!activeUser ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 bg-gray-200/50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-lg font-light">Boomerang Messages</p>
                <p className="text-gray-400 text-sm mt-1">Select a conversation or search for someone</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-2.5 bg-gray-100 dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveUser(null)} className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <Link to={`/users/${activeUser}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">{activeName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="text-[15px] font-medium text-gray-900 leading-tight">{activeName}</p>
                      {isTyping && <p className="text-xs text-primary-500">typing...</p>}
                    </div>
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-12 py-3 overscroll-contain">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-block bg-white/80 dark:bg-[#202c33]/80 backdrop-blur rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400 shadow-sm">Messages are end-to-end on Boomerang</div>
                  </div>
                )}
                {messageGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-[#202c33]/80 backdrop-blur px-3 py-1 rounded-md shadow-sm">{group.date}</span>
                    </div>
                    <div className="space-y-0.5">
                      {group.msgs.map((m: any, mi: number) => {
                        const isMine = m.sender_id === user?.id;
                        const isLast = mi === group.msgs.length - 1 || group.msgs[mi + 1]?.sender_id !== m.sender_id;
                        if (!m.body && !m.image) return null;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative max-w-[65%] px-3 py-1.5 text-[14.5px] leading-[19px] shadow-sm ${
                              isMine
                                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-lg rounded-tr-none'
                                : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-lg rounded-tl-none'
                            } ${m._optimistic ? 'opacity-60' : ''} ${isLast ? 'mb-1' : 'mb-px'}`}>
                              {m.image && (
                                <img src={m.image} alt="" className="rounded-md mb-1 max-w-full max-h-52 object-cover cursor-pointer" onClick={() => window.open(m.image, '_blank')} />
                              )}
                              {m.body && <span>{m.body}</span>}
                              <span className={`text-[10px] float-right mt-1 ml-2 ${isMine ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-400'}`}>
                                {formatTime(m.created_at)}
                                {isMine && <span className="ml-0.5">{m._optimistic ? '○' : '✓'}</span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-500 rounded-lg rounded-tl-none px-4 py-2.5 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="px-3 py-2 bg-gray-100 dark:bg-[#202c33] shrink-0">
                {pendingImage && (
                  <div className="mb-2 ml-1 relative inline-block">
                    <img src={pendingImage} alt="" className="h-16 rounded-md object-cover" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-gray-900">✕</button>
                  </div>
                )}
                {messages.length <= 2 && !pendingImage && (
                  <div className="flex gap-1.5 mb-2 ml-1 overflow-x-auto">
                    {(messages.length === 0
                      ? ["Hi, I'm interested in your service", "When are you available?", "Can you tell me more?", "How long does it take?"]
                      : ['Thanks!', 'When works for you?', 'Sounds good', 'See you then!']
                    ).map(qr => (
                      <button key={qr} onClick={() => { setNewMsg(qr); inputRef.current?.focus(); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-600 whitespace-nowrap shrink-0 shadow-sm">
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 items-end">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-200/50 active:bg-gray-200 touch-manipulation" aria-label="Attach photo">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </button>
                  <input ref={inputRef} value={newMsg} onChange={e => { setNewMsg(e.target.value); emitTyping(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message"
                    className="flex-1 min-w-0 bg-white dark:bg-[#2a3942] dark:text-gray-100 rounded-3xl px-4 py-2.5 text-[15px] focus:ring-1 focus:ring-primary-500 outline-none shadow-sm" />
                  <button onClick={send} disabled={sending || (!newMsg.trim() && !pendingImage)}
                    className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 shrink-0 shadow-sm">
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
