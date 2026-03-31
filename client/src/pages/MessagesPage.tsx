import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EMOJIS = ['😀','😂','❤️','👍','🙏','🎉','🔥','💪','🪃','⭐','👋','🤝','✅','📅','📍'];

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [convos, setConvos] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<number | null>(Number(searchParams.get('to')) || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.getConversations().then(setConvos).catch(() => {}); }, []);

  useEffect(() => {
    if (activeUser) {
      const loadMsgs = () => api.getDMs(activeUser).then(setMessages).catch(() => {});
      loadMsgs();
      const i = setInterval(loadMsgs, 5000);
      return () => clearInterval(i);
    }
  }, [activeUser]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!newMsg.trim() || !activeUser) return;
    setSending(true);
    try { await api.sendDM(activeUser, newMsg); setNewMsg(''); api.getDMs(activeUser).then(setMessages); }
    catch (err: any) { alert(err.message); }
    setSending(false); setShowEmoji(false);
  };

  const activeConvo = convos.find(c => c.id === activeUser);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Conversation list */}
        <div className="w-72 shrink-0 bg-white rounded-2xl shadow-card overflow-y-auto">
          {convos.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>}
          {convos.map((c: any) => (
            <button key={c.id} onClick={() => setActiveUser(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${activeUser === c.id ? 'bg-primary-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">{c.username?.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.username}</span>
                    {c.unread > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">{c.unread}</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white rounded-2xl shadow-card flex flex-col">
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation or message someone from their profile</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {activeConvo?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <Link to={`/users/${activeUser}`} className="text-sm font-semibold hover:text-primary-600">{activeConvo?.username || 'User'}</Link>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${m.sender_id === user?.id ? 'bg-primary-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-700 rounded-bl-md'}`}>
                      {m.body}
                      <div className={`text-[10px] mt-1 ${m.sender_id === user?.id ? 'text-primary-200' : 'text-gray-300'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100">
                {showEmoji && (
                  <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-xl">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setNewMsg(m => m + e)} className="text-xl hover:scale-125 transition-transform p-1">{e}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowEmoji(!showEmoji)} className="text-xl px-2 hover:bg-gray-100 rounded-lg" aria-label="Emojis">😊</button>
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  <button onClick={send} disabled={sending || !newMsg.trim()}
                    className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50">Send</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
