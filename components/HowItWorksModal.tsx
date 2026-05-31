import React from 'react';

interface HowItWorksModalProps {
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-[#064e3b]/40 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#fdfbf7] w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative border border-[#c5a059]/30 animate-fade-up"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l10 30 30 10-30 10-10 30-10-30-30-10 30-10z' fill='%23c5a059' fill-opacity='0.02'/%3E%3C/svg%3E")` }}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-10 w-12 h-12 rounded-full bg-white border border-[#e8e2d6] flex items-center justify-center text-[#3d5a45] hover:bg-[#064e3b] hover:text-white transition-all shadow-md font-bold"
        >
          ✕
        </button>

        <div className="p-8 md:p-20">
          <header className="text-center mb-16 space-y-6">
            <span className="amiri-font text-6xl text-[#c5a059] animate-sacred-glow block">۞</span>
            <h2 className="cinzel-font text-3xl md:text-5xl font-black text-[#064e3b] tracking-widest uppercase">The Path to Nikah</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-[#c5a059]/30"></div>
              <p className="amiri-font italic text-xl md:text-2xl text-[#3d5a45]/70">"Facilitating noble unions with sincerity and dignity."</p>
              <div className="h-px w-16 bg-[#c5a059]/30"></div>
            </div>
          </header>

          <div className="space-y-16">
            {/* Intro Section */}
            <div className="bg-white/60 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] border border-[#e8e2d6] shadow-sm">
              <p className="text-lg md:text-xl text-[#3d5a45] leading-relaxed font-medium">
                <span className="text-[#c5a059] font-black text-2xl mr-1">Sakina Rehman</span> is a dedicated halal marriage platform designed strictly in accordance with Islamic guidelines. We provide a sanctuary for sincere Muslims—both men and women—to find their spouses in an environment that honors our sacred traditions.
              </p>
            </div>

            {/* Methodology Steps */}
            <div className="grid grid-cols-1 gap-12">
              <Step 
                number="01" 
                title="Sincere Intentions" 
                description="Begin by creating a detailed Amanah profile. Share your faith, background, and expectations. Our verification process ensures every member is here with the noble intention of Nikah." 
              />
              <Step 
                number="02" 
                title="Mutual Interest" 
                description="Browse potential matches with modesty. Express your interest by 'liking' a profile. We only facilitate progress when interest is mutual, ensuring privacy and respect for both parties." 
              />
              <Step 
                number="03" 
                title="The Sacred Bridge" 
                description="Once a match is mutual, you may 'Contact the Mediator'. You will communicate directly with Sakina Rehman’s trained mediators—never directly with the match—to discuss the next steps." 
              />
              <Step 
                number="04" 
                title="Guided Interaction" 
                description="Our mediator coordinates a Google Meet video call. This meeting is conducted in the presence of Mahrams from both sides, ensuring the conversation remains dignified and within Islamic boundaries." 
              />
              <Step 
                number="05" 
                title="Family Independent Path" 
                description="After a successful mediated interaction, families may choose to exchange contact details and take matters forward independently to finalize the union as they see fit." 
              />
            </div>

            {/* Final Boundary Statement */}
            <div className="relative p-12 bg-[#064e3b] rounded-[3rem] text-center overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c5a059]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c5a059]/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
              
              <h3 className="cinzel-font text-white text-2xl font-black mb-6 uppercase tracking-widest relative z-10">Our Sacred Boundary</h3>
              <p className="text-white/90 text-sm md:text-base leading-relaxed font-bold uppercase tracking-widest relative z-10 max-w-2xl mx-auto">
                Sakina Rehman does not allow direct private chatting between male and female profiles. 
                By ensuring every step is mediated and family-involved, we preserve Haya and Ikhlas throughout your journey to a blessed marriage.
              </p>
            </div>
          </div>

          <footer className="mt-20 text-center">
            <button 
              onClick={onClose}
              className="py-5 px-16 bg-[#c5a059] text-white rounded-full font-black uppercase tracking-[0.3em] hover:bg-[#b08e4d] transition-all shadow-xl text-sm"
            >
              I Understand & Proceed
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex flex-col md:flex-row gap-8 items-start group animate-fade-up">
    <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#fdfbf7] border-2 border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] font-black text-2xl shadow-lg group-hover:bg-[#c5a059] group-hover:text-white transition-all duration-700">
      {number}
    </div>
    <div className="space-y-4 pt-4">
      <h4 className="cinzel-font text-2xl font-black text-[#064e3b] tracking-wide">{title}</h4>
      <p className="text-[#3d5a45]/80 text-lg leading-relaxed">{description}</p>
    </div>
  </div>
);

export default HowItWorksModal;