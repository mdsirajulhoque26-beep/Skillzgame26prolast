import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RulesModal: React.FC = () => {
  const { activeModal, closeModal } = useApp();

  if (activeModal !== 'rules') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="rules-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl relative text-white my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Skillzgame Rules & Guidelines</h3>
              <p className="text-[10px] text-slate-400">খেলার নিয়মাবলী ও নীতিমালা</p>
            </div>
          </div>
          <button
            id="rules-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1 scrollbar-none">
          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>১. গেমপ্লে ও স্কিল ম্যাচ (Block Puzzle Duel):</span>
            </h4>
            <p>Skillzgame এ প্রতিটি ম্যাচে নির্দিষ্ট সময়ের (যেমন ২ মিনিট) মধ্যে ১০x১০ গ্রিডে কৌশলগতভাবে ব্লক বসিয়ে লাইন ক্লিয়ার করতে হবে। কম্বো ও একাধিক লাইন একসাথে ক্লিয়ার করলে বেশি পয়েন্ট অর্জিত হয়।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>২. ফেয়ার প্লে ও ১v১ ডুয়েল নীতি:</span>
            </h4>
            <p>১v১ ম্যাচে উভয় প্রতিযোগী সম্পূর্ণ সমমানের র‍্যান্ডম ব্লক পিস সেট পান। খেলার ফলাফল সম্পূর্ণ প্লেয়ারের মেধা, দক্ষতা ও দ্রুত সিদ্ধান্তের উপর নির্ভর করে। কোনো অটো-ক্লিকার বা থার্ড পার্টি স্ক্রিপ্ট ব্যবহার সম্পূর্ণ নিষিদ্ধ।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>৩. রেজাল্ট ও অটোমেটিক উইনিং সেটেলমেন্ট:</span>
            </h4>
            <p>ম্যাচ সমাপ্ত হওয়ার পর উভয় প্লেয়ারের স্কোর সিস্টেমের সাথে সিঙ্ক হয় এবং সর্বোচ্চ স্কোরকারী প্লেয়ারকে সাথে সাথে বিজয়ী ঘোষণা করে প্রাইজ পুল তার উইনিং ব্যালেন্সে যোগ করা হয়।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-red-500/30">
            <h4 className="font-bold text-red-400 mb-1 flex items-center gap-1">
              <span>৪. সততা ও একাউন্ট নিরাপত্তা:</span>
            </h4>
            <p className="text-red-200">কোনো প্রকার হ্যাক, ভুয়া ট্রানজেকশন দাবি বা সিস্টেম প্রতারণার চেষ্টা করলে সংশ্লিষ্ট একাউন্ট স্থায়ীভাবে ব্যান করা হবে এবং বিদ্যমান ব্যালেন্স বাজেয়াপ্ত হবে।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
              <span>৫. ডিপোজিট, উইথড্রয়াল ও ব্যালেন্স:</span>
            </h4>
            <p>আপনার অ্যাকাউন্টে প্রদর্শিত payment method ও balance rules অনুসরণ করুন। Deposit/withdrawal-এর ক্ষেত্রে approved transaction record-ই চূড়ান্ত reference হিসেবে গণ্য হবে।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-cyan-500/20">
            <h4 className="font-bold text-cyan-300 mb-1"><span>৬. Match সমস্যা ও অভিযোগ:</span></h4>
            <p>Network, game load, automatic abort, score বা server error-এর কারণে কোনো Match-এ সমস্যা হলে Match History থেকে সংশ্লিষ্ট Match খুলে “Report Match Problem” দিয়ে অভিযোগ করা যাবে। Match ID, problem type ও বিস্তারিত তথ্য দিন। অভিযোগ server record, match status ও transaction record যাচাই করে review করা হবে।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-amber-500/20">
            <h4 className="font-bold text-amber-300 mb-1"><span>৭. Technical Dispute:</span></h4>
            <p>শুধু player-এর বক্তব্যের ভিত্তিতে result পরিবর্তন করা হবে না। প্রমাণিত server-side technical failure হলে কর্তৃপক্ষ প্রযোজ্য correction, refund বা অন্য সমাধানের সিদ্ধান্ত নিতে পারবে। একই Match-এর জন্য duplicate complaint করা যাবে না।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-violet-300 mb-1"><span>৮. Account, Referral ও Fair Use:</span></h4>
            <p>একাধিক/fake account, self-referral, referral abuse, bot, auto-clicker, script, exploit বা match manipulation নিষিদ্ধ। সন্দেহজনক activity review, suspension বা ban-এর আওতায় আসতে পারে।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-red-500/30">
            <h4 className="font-bold text-red-300 mb-1"><span>৯. Fraud ও Abuse:</span></h4>
            <p>ভুয়া transaction, fraud, cheating বা system abuse শনাক্ত হলে সংশ্লিষ্ট account-এর access/bonus/result review বা restriction করা হতে পারে। প্রয়োজন হলে প্রযোজ্য আইন ও কর্তৃপক্ষের নিয়ম অনুসরণ করা হবে।</p>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs"
        >
          আমি সকল নিয়ম মেনে নিচ্ছি
        </button>
      </div>
    </div>
  );
};
