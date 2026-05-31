import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  sender: 'mediator' | 'user';
  text: string;
  timestamp: Date;
}

interface MediatorChatProps {
  onClose: () => void;
  userUid: string;
}

const MediatorChat: React.FC<MediatorChatProps> = ({ onClose, userUid }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'mediator',
      text: "Assalamu Alaikum! I am Sakina Rehman, your dedicated mediator. I see you have potential Nikah matches. JazakAllah Khair for your trust.",
      timestamp: new Date()
    },
    {
      id: 2,
      sender: 'mediator',
      text: "Which ID numbers of the Halal Matches would you like to schedule a meeting with? Please provide them one by one, and also let me know who your Mahram will be for the session. Shukriya.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate mediator response
    setTimeout(() => {
      const response: Message = {
        id: Date.now() + 1,
        sender: 'mediator',
        text: getMediatorResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const getMediatorResponse = (text: string): string => {
    const input = text.toLowerCase();
    
    // Check for ID numbers pattern (e.g., SR-1234-A)
    if (input.match(/sr-\d{4}-[a-z]/i) || (input.includes('id') && /\d/.test(input))) {
      return "Shukriya for providing the ID number. I am now reaching out to the family of this candidate to check their interest and availability. Please provide the next ID if any, or confirm your Mahram's details. JazakAllah Khair.";
    }

    // Check for Mahram details
    if (input.includes('mahram') || input.includes('father') || input.includes('brother') || input.includes('uncle')) {
      return "MashaAllah, noted. Safety and dignity are paramount. I will now proceed to coordinate a Google Meet time slot with both families present. Shukriya for your patience. Assalamu Alaikum.";
    }

    // Check for contact details
    if (input.match(/\d{10,}/) || input.includes('whatsapp') || input.includes('number')) {
      return "JazakAllah Khair for sharing your contact details. I will reach out to you personally to coordinate the schedule. May Allah grant barakah in this process.";
    }

    return "JazakAllah Khair for your message. Please provide the ID numbers of the Halal Matches one by one so I can begin the mediation process for you. Shukriya.";
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl h-[100dvh] md:h-[85vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-up border border-[#c5a059]/20">
        {/* Header */}
        <header className="bg-[#064e3b] p-6 text-white flex items-center justify-between shadow-lg relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl border border-white/20 animate-sacred-glow">
              ۞
            </div>
            <div>
              <h3 className="cinzel-font text-xl font-bold tracking-widest">Sakina Rehman</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Dedicated Mediator</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all text-xl font-bold"
          >
            ✕
          </button>
        </header>

        {/* Chat Body */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-6 bg-[#fdfbf7] geometric-bg">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] p-5 md:p-6 rounded-[1.5rem] shadow-md border ${
                m.sender === 'user' 
                  ? 'bg-[#c5a059] text-white border-[#c5a059]/30 rounded-tr-none' 
                  : 'bg-white border-[#e8e2d6] text-[#3d5a45] rounded-tl-none'
              }`}>
                <p className={`text-sm md:text-base leading-relaxed ${m.sender === 'mediator' ? 'amiri-font italic text-lg' : ''}`}>
                  {m.text}
                </p>
                <div className={`mt-3 flex items-center gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[8px] font-black uppercase tracking-tighter opacity-60`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {m.sender === 'mediator' && <span className="text-[10px] text-[#c5a059]">۞</span>}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 border-t border-[#e8e2d6] bg-white relative z-20">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Assalamu Alaikum... write your message"
              className="flex-grow p-5 bg-[#fdfbf7] border border-[#e8e2d6] rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-sm md:text-base transition-all shadow-inner"
            />
            <button 
              onClick={handleSend}
              className="bg-[#064e3b] text-white p-5 rounded-2xl shadow-xl hover:bg-[#043327] active:scale-95 transition-all group"
            >
              <svg className="w-7 h-7 rotate-90 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
            <p className="text-[9px] text-[#3d5a45]/40 font-black uppercase tracking-widest">
              ID: {userUid}
            </p>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[8px] font-black uppercase text-[#064e3b]/40">Mediator Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediatorChat;