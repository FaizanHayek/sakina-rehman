import React, { useState } from 'react';

interface ProfileDetailsProps {
  profile: any;
  onClose: () => void;
  isLiked?: boolean;
  isMutual?: boolean;
  onLike?: (e: React.MouseEvent) => void;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ 
  profile, 
  onClose,
  isLiked = false,
  isMutual = false,
  onLike
}) => {
  const [activeImage, setActiveImage] = useState(profile.image);
  const [isContacted, setIsContacted] = useState(() => {
    return localStorage.getItem(`contacted_mediator_${profile.id}`) === 'true';
  });

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(`contacted_mediator_${profile.id}`, 'true');
    setIsContacted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fdfbf7] w-full max-w-5xl h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative animate-fade-up">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-4 rounded-full bg-white/20 hover:bg-white/40 transition-all text-white font-bold"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Images & Gallery */}
          <div className="bg-neutral-950 flex flex-col justify-between sticky top-0">
            <div className="flex-grow w-full relative overflow-hidden h-[40vh] lg:h-[70vh]">
              <img src={activeImage} alt={profile.name} className="w-full h-full object-cover transition-all" referrerPolicy="no-referrer" />
            </div>
            {profile.images && profile.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-[#fdfbf7] border-t border-[#e8e2d6] justify-center items-center w-full">
                {profile.images.map((img: string, index: number) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveImage(img)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-[#c5a059] scale-105 shadow-md font-bold' : 'border-[#e8e2d6] opacity-75 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="p-8 md:p-12 space-y-10">
            <div>
              <h2 className="cinzel-decorative text-4xl font-black text-[#064e3b] mb-2">{profile.name}</h2>
              <p className="serif-heading italic text-[#c5a059] text-xl">{profile.age} years • {profile.city}, {profile.country || 'India'}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#e8e2d6]">
              <Detail label="Occupation" value={profile.occupation} />
              <Detail label="Education" value={profile.degreeName ? `${profile.education} (${profile.degreeName})` : profile.education} />
              <Detail label="Religiosity" value={profile.religiosity} />
              <Detail label="Sect & Maslak / Firqa" value={`${profile.sect} ${profile.maslak || profile.firqa ? `• ${profile.maslak || profile.firqa}` : ''}`} />
              <Detail label="Salah Frequency" value={`${profile.salah} times/day`} />
              <Detail label="Height / Weight" value={`${profile.height} cm / ${profile.weight} kg`} />
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#3d5a45] opacity-60">About / Hobbies</h4>
              <p className="serif-heading italic text-[#3d5a45] text-lg leading-relaxed">{profile.hobbies}</p>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4">
              <ActionButton 
                label={isLiked ? "Unlike Profile" : "Like Profile"} 
                icon={isLiked ? "♥" : "♡"} 
                variant={isLiked ? "gold" : "default"} 
                onClick={onLike}
              />
              <ActionButton 
                label={isMutual ? "Congrats! You're Mutual Now" : "Waiting for the LIKE BACK"} 
                icon={isMutual ? "💖" : "⏳"} 
                variant={isMutual ? "gold" : "default"}
                disabled={true}
                className={isMutual ? "border-2 border-[#c5a059] bg-[#c5a059]/10 !text-[#c5a059]" : isLiked ? "opacity-100 bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" : "opacity-40 bg-[#e8e2d6] text-[#3d5a45]"}
              />
              <ActionButton 
                label={isContacted ? "Our Mediator will Contact You" : "Contact Mediator"} 
                icon={isContacted ? "✓" : "✉"} 
                variant="emerald" 
                onClick={handleContact}
                className={isContacted ? "bg-emerald-700/85 text-white scale-95 pointer-events-none" : ""}
              />
            </div>

            <div className="pt-12 text-center border-t border-[#e8e2d6]">
              <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.3em] mb-4">۞ Islamic Boundary Statement ۞</p>
              <p className="text-[10px] text-[#3d5a45]/60 leading-relaxed uppercase tracking-wider">
                Any communication initiated will be facilitated according to Islamic principles, respecting the dignity and modesty of all parties involved. No face-to-face meetings without mahrams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/50">{label}</span>
    <p className="font-bold text-[#3d5a45]">{value}</p>
  </div>
);

const ActionButton: React.FC<{ 
  label: string; 
  icon: string; 
  variant?: 'default' | 'gold' | 'emerald';
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}> = ({ label, icon, variant = 'default', onClick, disabled = false, className = '' }) => {
  const styles = {
    default: 'bg-[#e8e2d6] text-[#3d5a45] hover:bg-[#d8d2c6]',
    gold: 'bg-[#c5a059] text-white hover:bg-[#b08e4d]',
    emerald: 'bg-[#064e3b] text-white hover:bg-[#043327]'
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`flex-grow sm:flex-1 py-4 px-2 rounded-2xl font-bold text-[11px] md:text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      <span>{icon}</span> {label}
    </button>
  );
};

export default ProfileDetails;