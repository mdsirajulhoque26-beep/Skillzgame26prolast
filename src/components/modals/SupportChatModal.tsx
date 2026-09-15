import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { backendApi } from '../../services/backendApi';
import { MessageCircle, Send, X, Headphones, CheckCircle2, Loader2 } from 'lucide-react';

export const SupportChatModal: React.FC = () => {
  const { activeModal, closeModal } = useApp();
  const [chat, setChat] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadChat = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const data = await backendApi.supportChat(); const incoming = data.chat || null; setChat(prev => { if (!incoming) return prev; if (!prev) return incoming; const prevTime = Date.parse(prev.updatedAt || prev.createdAt || 0); const incomingTime = Date.parse(incoming.updatedAt || incoming.createdAt || 0); return incomingTime >= prevTime ? incoming : prev; }); }
    catch (e) { console.error('Support chat load failed:', e); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    if (activeModal !== 'support') return;
    loadChat();
    const timer = window.setInterval(() => loadChat(true), 4000);
    return () => window.clearInterval(timer);
  }, [activeModal]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat?.messages?.length]);

  if (activeModal !== 'support') return null;

  const send = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try { const data = await backendApi.sendSupportMessage(text); setChat(data.chat); setMessage(''); }
    catch (e:any) { alert(e?.message || 'Message পাঠানো যায়নি।'); }
    finally { setSending(false); }
  };

  const closeChat = async () => {
    try { const data = await backendApi.closeSupportChat(); setChat(data.chat); }
    catch (e:any) { alert(e?.message || 'Chat বন্ধ করা যায়নি।'); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
    <div className="w-full max-w-md h-[min(680px,92vh)] bg-[#121935] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
      <div className="p-4 border-b border-indigo-900 flex items-center justify-between bg-[#10162f]">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center"><Headphones className="w-5 h-5"/></div><div><h3 className="font-black">Live Support Chat</h3><p className="text-[10px] text-emerald-400">● Support team • Reply in chat</p></div></div>
        <button onClick={closeModal} className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0b1022]">
        {loading && !chat ? <div className="h-full flex items-center justify-center text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2"/>Chat loading...</div> : !chat ? <div className="h-full flex flex-col items-center justify-center text-center text-slate-400"><MessageCircle className="w-10 h-10 text-cyan-400 mb-3"/><p className="font-bold text-slate-200">Support-এ message পাঠান</p><p className="text-xs mt-1">আপনার সমস্যা লিখে Send চাপুন।</p></div> : <>
          {chat.messages?.map((m:any) => <div key={m.id} className={`flex ${m.senderType === 'ADMIN' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 ${m.senderType === 'ADMIN' ? 'bg-indigo-900/70 border border-indigo-700 text-slate-100' : 'bg-cyan-600 text-white'}`}><div className="text-[11px] leading-relaxed whitespace-pre-wrap">{m.message}</div><div className="text-[8px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleString('en-GB')}</div></div></div>)}
          <div ref={bottomRef}/>
        </>}
      </div>
      {chat?.status === 'CLOSED' && <div className="px-3 py-2 bg-emerald-500/10 border-t border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>এই support chatটি closed হয়েছে। নতুন message পাঠালে আবার open হবে।</div>}
      <div className="p-3 border-t border-indigo-900 bg-[#10162f]">
        <div className="flex gap-2"><textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} rows={2} maxLength={2000} placeholder="আপনার সমস্যাটি লিখুন..." className="flex-1 resize-none bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"/><button onClick={send} disabled={!message.trim()||sending} className="w-11 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4"/></button></div>
        {chat?.status !== 'CLOSED' && <button onClick={closeChat} className="mt-2 text-[10px] text-slate-500 hover:text-slate-300">Chat resolved হলে Close করুন</button>}
      </div>
    </div>
  </div>;
};
