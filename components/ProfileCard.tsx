import React from 'react';

interface ProfileCardProps {
  profile: any;
  onClick: () => void;
  isLiked?: boolean;
  onLike?: (e: React.MouseEvent) => void;
  compatibilityScore?: number;
  isMutual?: boolean;
  onContactMediator?: (e: React.MouseEvent) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onClick, 
  isLiked = false, 
  onLike, 
  compatibilityScore,
  isMutual = false,
  onContactMediator
}) => {
  const isLowCompatibility = compatibilityScore !== undefined && compatibilityScore <= 50;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border group cursor-pointer relative ${
        isMutual 
          ? 'border-[#c5a059] ring-2 ring-[#c5a059]/20 animate-border-glow' 
          : 'border-[#e8e2d6]'
      }`}
    >
      {/* Mutual Interest Pink Mark - Top Center */}
      {isMutual && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[30]">
          <div className="bg-[#ff69b4] w-6 h-6 rounded-b-full shadow-[0_4px_10px_rgba(255,105,180,0.4)] flex items-center justify-center animate-bounce-slow">
            <span className="text-white text-[10px]">♥</span>
          </div>
        </div>
      )}

      {/* Unique ID - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-[9px] font-black text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md tracking-tighter uppercase">
          ID: {profile.uid}
        </span>
      </div>

      {/* Compatibility Badge / Red Mark */}
      {compatibilityScore !== undefined && !isMutual && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`${isLowCompatibility ? 'bg-red-600 animate-pulse' : 'bg-[#064e3b]'} text-white px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 transition-colors`}>
            {isLowCompatibility && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
            <span className="text-[10px] font-black uppercase tracking-widest">{compatibilityScore}% Match</span>
          </div>
        </div>
      )}

      {/* Sacred Union Badge for Mutual Likes */}
      {isMutual && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-[#c5a059] text-white px-4 py-2 rounded-full shadow-xl border border-white/30 flex items-center gap-2 animate-pulse-soft">
            <span className="text-sm">۞</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Sacred Union</span>
          </div>
        </div>
      )}

      <div className="relative aspect-[4/5] overflow-hidden">
        {/* Profile Image Animation: Subtle scale and brightness shift */}
        <img 
          src={profile.image} 
          alt={profile.name} 
          className="w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-105 group-hover:brightness-110"
        />
        <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-700 ${
          isMutual 
            ? 'from-[#c5a059]/90 via-[#c5a059]/20 to-transparent opacity-50 group-hover:opacity-30'
            : 'from-[#064e3b]/90 via-[#064e3b]/20 to-transparent opacity-60 group-hover:opacity-40'
        }`}></div>
        
        {/* Like Button */}
        <button 
          onClick={onLike}
          className={`absolute bottom-4 right-4 z-20 p-4 rounded-full backdrop-blur-md border transition-all duration-500 active:scale-75 ${
            isLiked 
              ? 'bg-[#c5a059] border-[#c5a059] text-white shadow-[0_0_20px_rgba(197,160,89,0.5)]' 
              : 'bg-white/20 border-white/40 text-white hover:bg-white/40'
          }`}
        >
          <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none stroke-current'}`} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute bottom-5 left-6 right-16 text-white transition-transform duration-500 group-hover:-translate-y-1">
          <h4 className="cinzel-font text-2xl font-bold tracking-tight mb-0.5">{profile.name}</h4>
          <p className="text-sm font-medium opacity-90">{profile.age} years • {profile.city}, {profile.country}</p>
        </div>
      </div>

      <div className="p-6 space-y-4 bg-white relative z-10">
        <div className="flex flex-wrap gap-2">
          <Tag text={profile.occupation} />
          <Tag text={profile.degreeName || profile.education} />
          <Tag text={profile.religiosity} variant="gold" />
        </div>
        <p className="text-[#3d5a45] text-sm line-clamp-2 italic font-medium opacity-80 group-hover:opacity-100 transition-opacity">"{profile.hobbies}"</p>
        
        <div className="pt-4 flex items-center justify-between border-t border-[#e8e2d6]">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">{profile.sect}</span>
          
          <button className="relative flex items-center gap-2 text-[#064e3b] font-black text-[10px] uppercase tracking-widest transition-all duration-300 group/details py-1.5 px-3 rounded-lg overflow-hidden">
            <span className="absolute inset-0 bg-[#064e3b]/5 scale-x-0 group-hover/details:scale-x-100 origin-left transition-transform duration-300"></span>
            <span className="relative z-10 group-hover/details:text-[#c5a059] transition-colors">View Details</span>
            <span className="relative z-10 transition-transform duration-300 group-hover/details:translate-x-2 group-hover/details:text-[#c5a059] inline-block font-bold">→</span>
          </button>
        </div>

        {/* Mutual Match CTA Button */}
        {isMutual && onContactMediator && (
          <div className="pt-2">
            <button 
              onClick={onContactMediator}
              className="w-full bg-[#064e3b] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#043327] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-xs">✉</span>
              Contact the Mediator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Tag: React.FC<{ text: string; variant?: 'default' | 'gold' }> = ({ text, variant = 'default' }) => (
  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-colors ${variant === 'gold' ? 'bg-[#c5a059]/10 text-[#c5a059] group-hover:bg-[#c5a059]/20' : 'bg-[#3d5a45]/5 text-[#3d5a45] group-hover:bg-[#3d5a45]/10'}`}>
    {text}
  </span>
);

export default ProfileCard;