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
    try {
      await api.sendDM(activeUser, newMsg);
      setNewMsg('');
      const msgs = await api.getDMs(activeUser);
      setMessages(msgs);
      api.getConversations().then(setConvos).catch(() => {});
    } catch (err: any) { alert(err.message); }
    setSending(false); setShowEmoji(false);
  };

  const activeConvo = convos.find(c => c.id === activeUser);
  const [activeUserInfo, setActiveUserInfo] = useState<any>(null);

  // Fetch user info when activeUser changes and isn't in convos
  useEffect(() => {
    if (activeUser && !convos.find(c => c.id === activeUser)) {
      api.getUser(activeUser).then(setActiveUserInfo).catch(() => {});
    } else {
      setActiveUserInfo(null);
    }
  }, [activeUser, convos]);

  const activeName = activeConvo?.username || activeUserInfo?.username || 'User';
  const showChat = activeUser !== null;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">

        {/* Conversation list — hidden on mobile when chat is open */}
        <div className={`${showChat ? 'hidden md:block' : 'block'} w-full md:w-72 shrink-0 bg-white rounded-2xl shadow-card overflow-y-auto`}>
          {convos.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-300 mt-1">Visit someone's profile and click Message to start</p>
            </div>
          )}
          {convos.map((c: any) => (
            <button key={c.id} onClick={() => setActiveUser(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeUser === c.id ? 'bg-primary-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">{c.username?.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{c.username}</span>
                    {c.unread > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center shrink-0">{c.unread}</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat area — full width on mobile */}
        <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-2xl shadow-card flex-col`}>
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation</div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveUser(null)} className="md:hidden text-gray-400 hover:text-gray-600 mr-1" aria-label="Back">
                    ← 
                  </button>
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                  <Link to={`/users/${activeUser}`} className="text-sm font-semibold hover:text-primary-600">{activeName}</Link>
                </div>
                <a href={`https://meet.jit.si/boomerang-${[user?.id, activeUser].sort().join('-')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600">
                  📞 Call
                </a>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && <p className="text-center text-gray-300 text-sm py-8">Start the conversation</p>}
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${m.sender_id === user?.id ? 'bg-primary-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-700 rounded-bl-md'}`}>
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
              <div className="px-3 py-3 border-t border-gray-100 shrink-0">
                {showEmoji && (
                  <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-xl">
                    {EMOJIS.map(e => <button key={e} onClick={() => setNewMsg(m => m + e)} className="text-xl hover:scale-125 transition-transform p-1">{e}</button>)}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowEmoji(!showEmoji)} className="text-xl px-2 hover:bg-gray-100 rounded-lg shrink-0" aria-label="Emojis">😊</button>
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..." className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  <button onClick={send} disabled={sending || !newMsg.trim()}
                    className="bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 shrink-0">Send</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
