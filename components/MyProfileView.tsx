import React, { useState, useRef } from 'react';

interface MyProfileViewProps {
  userProfile: any;
  userPrefs: any;
  onUpdate: (updatedProfile: any, updatedPrefs: any) => Promise<void>;
  onBack: () => void;
}

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const HOBBIES_LIST = [
  "Cooking", "Coffee", "Morning walks", "Cycling", "Reading", "Road trips", "Fitness", "Writing", "Podcasts", "Travel", "Gardening", "Painting"
];

const MyProfileView: React.FC<MyProfileViewProps> = ({ userProfile, userPrefs, onUpdate, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || userProfile?.name || 'Guest User',
    gender: userProfile?.gender || 'male',
    age: userProfile?.age || '25',
    city: userProfile?.city || 'Mumbai',
    state: userProfile?.state || 'Maharashtra',
    country: userProfile?.country || 'India',
    height: userProfile?.height || '170',
    weight: userProfile?.weight || '65',
    sect: userProfile?.sect || 'Sunni',
    maslak: userProfile?.maslak || 'Deobandi',
    firqa: userProfile?.firqa || '',
    religiosity: userProfile?.religiosity || 'Moderate',
    salah: userProfile?.salah || 5,
    fatherName: userProfile?.fatherName || '',
    motherName: userProfile?.motherName || '',
    fatherOccupation: userProfile?.fatherOccupation || '',
    occupation: userProfile?.occupation || 'Engineer',
    education: userProfile?.education || 'Bachelors',
    degreeName: userProfile?.degreeName || '',
    salary: userProfile?.salary || 40000,
    hobbies: Array.isArray(userProfile?.hobbies) ? userProfile.hobbies : [userProfile?.hobbies].filter(Boolean),
    likes: userProfile?.likes || '',
    dislikes: userProfile?.dislikes || '',
  });

  const [prefData, setPrefData] = useState({
    prefGender: userPrefs?.prefGender || (userProfile?.gender === 'male' ? 'female' : 'male'),
    prefAgeMin: userPrefs?.prefAgeMin || 20,
    prefAgeMax: userPrefs?.prefAgeMax || 40,
    prefCountry: userPrefs?.prefCountry || 'India',
    prefState: userPrefs?.prefState || '',
    prefHeightMin: userPrefs?.prefHeightMin || 140,
    prefHeightMax: userPrefs?.prefHeightMax || 200,
    prefWeightMin: userPrefs?.prefWeightMin || 40,
    prefWeightMax: userPrefs?.prefWeightMax || 120,
    prefSect: userPrefs?.prefSect || 'Sunni',
    prefFirqa: userPrefs?.prefFirqa || '',
    prefReligiosity: userPrefs?.prefReligiosity || 'Moderate',
    prefSalah: userPrefs?.prefSalah || 5,
    prefEducation: userPrefs?.prefEducation || 'Bachelors',
    prefSalary: userPrefs?.prefSalary || 30000,
  });

  const [images, setImages] = useState<(string | null)[]>(() => {
    const existing = userProfile?.images || [];
    const filled = [...existing];
    while (filled.length < 5) {
      filled.push(null);
    }
    // ensure index 0 is populated with primary image if empty
    if (!filled[0] && userProfile?.image) {
      filled[0] = userProfile.image;
    }
    return filled;
  });

  // Photo viewer state for the static display
  const [activeImage, setActiveImage] = useState(() => {
    return userProfile?.image || userProfile?.images?.[0] || 'https://images.unsplash.com/photo-1620573994323-5e921d18728d?q=80&w=1974&auto=format&fit=crop';
  });

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrefTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPrefData(prev => ({ ...prev, [name]: value }));
  };

  const toggleHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby) 
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const processFile = (index: number, file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > maxSize) {
      setUploadError("The image file size exceeds the 5MB limit.");
      return;
    }
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);

    const validImages = images.filter(img => img !== null);
    if (validImages.length < 1) {
      setUploadError("You must have at least one profile picture.");
      setSaving(false);
      return;
    }

    const updatedProfile = {
      ...formData,
      name: formData.fullName,
      image: validImages[0] || '',
      images: validImages,
    };

    try {
      await onUpdate(updatedProfile, prefData);
      setIsEditing(false);
      setSuccessMsg("Your Nikah Profile has been updated successfully!");
      setActiveImage(updatedProfile.image);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setUploadError("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-4">
      {/* Header bar / Back action */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-[#064e3b]/5 text-[#064e3b] border border-[#c5a059]/20 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to browsing
        </button>

        {!isEditing && (
          <button 
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#c5a059] text-white hover:bg-[#b08e4d] rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
          >
            <span>✍️</span> Edit Profile
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 mb-8 bg-[#ecfdf5] border border-emerald-500/30 text-[#065f46] rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-md animate-fade-in">
          <span>✅</span> {successMsg}
        </div>
      )}

      {uploadError && (
        <div className="p-4 mb-8 bg-amber-50 border border-amber-500/30 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-md animate-fade-in">
          <span>⚠️</span> {uploadError}
        </div>
      )}

      {/* STATIC MODE VIEW */}
      {!isEditing ? (
        <div className="bg-[#fdfbf7] rounded-[3.5rem] border border-[#e8e2d6] shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">
            
            {/* Left Column: Visual Portfolio (Photos Box) */}
            <div className="lg:col-span-5 bg-stone-100 flex flex-col h-[50vh] lg:h-auto relative">
              <div className="flex-grow w-full h-full relative">
                <img 
                  src={activeImage} 
                  alt={formData.fullName} 
                  className="w-full h-full object-cover transition-all duration-500" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Dynamic Bottom Carousel Strip */}
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex gap-2.5 justify-center z-10 overflow-x-auto">
                {images.filter(Boolean).map((img, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img!)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImage === img ? 'border-[#c5a059] scale-110 shadow-md' : 'border-white/30 hover:border-white'}`}
                  >
                    <img src={img!} alt="Carousel" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Detailed Parameters */}
            <div className="lg:col-span-7 p-8 md:p-14 space-y-12">
              <div className="border-b border-[#e8e2d6] pb-8">
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-[#c5a059]">Your Personal Identity Card</span>
                <h1 className="cinzel-decorative text-3xl md:text-5xl text-[#064e3b] font-black mt-2 leading-tight">
                  {formData.fullName}
                </h1>
                <p className="amiri-font italic text-[#3d5a45]/80 text-2xl mt-1.5">
                  {formData.age} years old • {formData.city}, {formData.country}
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] font-black tracking-widest bg-[#064e3b]/10 text-[#064e3b] uppercase px-3 py-1.5 rounded-full border border-[#064e3b]/10">
                    {formData.sect} Sect
                  </span>
                  {formData.maslak && (
                    <span className="text-[10px] font-black tracking-widest bg-[#c5a059]/10 text-[#c5a059] uppercase px-3 py-1.5 rounded-full border border-[#c5a059]/10">
                      {formData.maslak}
                    </span>
                  )}
                  <span className="text-[10px] font-black tracking-widest bg-stone-100 text-[#3d5a45]/80 uppercase px-3 py-1.5 rounded-full">
                    Religiosity: {formData.religiosity}
                  </span>
                  <span className="text-[10px] font-black tracking-widest bg-stone-100 text-[#3d5a45]/80 uppercase px-3 py-1.5 rounded-full">
                    Salah Frequency: {formData.salah}/5 Daily
                  </span>
                </div>
              </div>

              {/* Vital Stat Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/70 p-6 rounded-[2rem] border border-[#e8e2d6] shadow-inner font-mono text-center">
                <div className="border-r border-[#e8e2d6]/50 last:border-none">
                  <span className="block text-[9px] text-[#3d5a45]/40 uppercase tracking-wider font-sans font-bold">Height</span>
                  <span className="text-xl font-bold text-[#064e3b]">{formData.height} cm</span>
                </div>
                <div className="border-r border-[#e8e2d6]/50 last:border-none">
                  <span className="block text-[9px] text-[#3d5a45]/40 uppercase tracking-wider font-sans font-bold">Weight</span>
                  <span className="text-xl font-bold text-[#064e3b]">{formData.weight} kg</span>
                </div>
                <div className="border-r border-[#e8e2d6]/50 last:border-none">
                  <span className="block text-[9px] text-[#3d5a45]/40 uppercase tracking-wider font-sans font-bold">Salary (Monthly)</span>
                  <span className="text-xl font-bold text-[#047857]">₹{parseInt(formData.salary as any).toLocaleString('en-IN')}</span>
                </div>
                <div className="last:border-none">
                  <span className="block text-[9px] text-[#3d5a45]/40 uppercase tracking-wider font-sans font-bold">Education</span>
                  <span className="text-base font-bold text-[#064e3b] uppercase truncate block px-1">{formData.education}</span>
                </div>
              </div>

              {/* Sub sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Career and Background */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b] opacity-65 flex items-center gap-2">
                    🎓 Career & Education
                  </h3>
                  <div className="space-y-3 bg-white/50 p-5 rounded-2xl border border-[#e8e2d6]/60">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40">Degree Details</span>
                      <p className="font-bold text-sm text-[#3d5a45]">{formData.degreeName || "Not Specified"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40">Current Profession</span>
                      <p className="font-bold text-sm text-[#3d5a45]">{formData.occupation}</p>
                    </div>
                  </div>
                </div>

                {/* Family Lineage */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b] opacity-65 flex items-center gap-2">
                    👨‍👩‍👦 Family Background
                  </h3>
                  <div className="space-y-3 bg-white/50 p-5 rounded-2xl border border-[#e8e2d6]/60">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40">Father's Name</span>
                      <p className="font-bold text-sm text-[#3d5a45]">{formData.fatherName || "Not Specified"}</p>
                    </div>
                    {formData.fatherOccupation && (
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40">Father's Occupation</span>
                        <p className="font-bold text-sm text-[#3d5a45]">{formData.fatherOccupation}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40">Mother's Name</span>
                      <p className="font-bold text-sm text-[#3d5a45]">{formData.motherName || "Not Specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona and Alignment */}
              <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b] opacity-65">🎯 Interests, Likes & Dislikes</h3>
                <div className="space-y-5">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40 mb-3.5">Selected Hobbies</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.hobbies.length > 0 ? (
                        formData.hobbies.map(hobby => (
                          <span key={hobby} className="px-4 py-2 bg-white border border-[#e8e2d6] text-xs font-bold text-[#3d5a45] rounded-xl">
                            ⭐ {hobby}
                          </span>
                        ))
                      ) : (
                        <span className="italic text-xs text-stone-400">None selected</span>
                      )}
                    </div>
                  </div>

                  {formData.likes && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40 block mb-1">What you represent or prefer in life</span>
                      <p className="serif-heading italic text-[#3d5a45] text-base leading-relaxed bg-[#fdfbf4] p-4 rounded-xl border border-[#e8e2d6]">{formData.likes}</p>
                    </div>
                  )}

                  {formData.dislikes && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/40 block mb-1">Things you strictly dislike or wish to avoid</span>
                      <p className="serif-heading italic text-stone-500 text-base leading-relaxed bg-stone-50 p-4 rounded-xl border border-[#e8e2d6]">{formData.dislikes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Preferences Card */}
              <div className="bg-[#064e3b]/5 p-8 rounded-[2.5rem] border border-[#c5a059]/20 space-y-6">
                <div>
                  <h3 className="cinzel-font text-lg text-[#064e3b] font-black uppercase tracking-widest mb-1">💫 Desired Partner Mandates</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059] opacity-80">Ideal alignment parameters preferred during search</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-sm py-2">
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50">Age Range</span>
                    <span className="font-extrabold text-[#3d5a45]">{prefData.prefAgeMin} - {prefData.prefAgeMax} yrs</span>
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50">Preferred Sect</span>
                    <span className="font-extrabold text-[#3d5a45] uppercase">{prefData.prefSect || "No Limit"}</span>
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50">Height Criteria</span>
                    <span className="font-extrabold text-[#3d5a45]">{prefData.prefHeightMin}cm - {prefData.prefHeightMax}cm</span>
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50">Weight Criteria</span>
                    <span className="font-extrabold text-[#3d5a45]">{prefData.prefWeightMin}kg - {prefData.prefWeightMax}kg</span>
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50">Religiosity</span>
                    <span className="font-extrabold text-[#3d5a45]">{prefData.prefReligiosity || "Moderate"}</span>
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-[9px] uppercase tracking-wider text-[#3d5a45]/50 flex items-center gap-1">Expected Income</span>
                    <span className="font-extrabold text-[#047857]">₹{parseInt(prefData.prefSalary as any).toLocaleString('en-IN')}+</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 text-center border-t border-[#e8e2d6] space-y-4">
                <span className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.3em] block">۞ Permanent Sanctuary Guard ۞</span>
                <p className="text-[10px] text-[#3d5a45]/60 uppercase tracking-widest leading-loose">
                  Your profile meets the Islamic modesty directives. Changes are secured locally & stored inside your sacred profile document.
                </p>
              </div>
            </div>
            
          </div>
        </div>
      ) : (
        /* EDITING MODE FORM */
        <form onSubmit={handleSave} className="bg-[#fdfbf7] rounded-[3.5rem] border border-[#e8e2d6] p-8 md:p-14 space-y-12 shadow-2xl animate-fade-up">
          <div className="border-b border-[#e8e2d6] pb-6 flex justify-between items-center">
            <div>
              <h2 className="serif-heading text-2xl md:text-3xl text-[#064e3b] font-bold">Edit your Nikah Parameters</h2>
              <p className="text-stone-400 text-xs uppercase tracking-widest mt-1">Refine and save your profile variables to reflect real values</p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="text-stone-400 hover:text-red-500 text-xs font-black uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>

          {/* Edit Photos Block */}
          <div className="space-y-6">
            <span className="block text-[11px] font-black uppercase tracking-widest text-[#064e3b]">
              📸 Customize Portfolio Photos (Minimum 1 Required)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleImageClick(idx)}
                  className={`aspect-[3/4] rounded-2xl border-2 border-dashed relative overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 ${img ? 'border-solid border-[#c5a059] bg-stone-50' : 'border-[#e8e2d6] hover:border-[#c5a059] hover:bg-[#064e3b]/5'}`}
                >
                  {img ? (
                    <>
                      <img src={img} alt="portfolio" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={(e) => removeImage(idx, e)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all shadow-md z-10"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-1 left-2 text-[8px] bg-black/50 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {idx === 0 ? 'Primary' : `Slot ${idx + 1}`}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <span className="text-xl block mb-1">📤</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#3d5a45]/60">Select Image</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={el => { fileInputRefs.current[idx] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(idx, file);
                    }}
                    className="hidden" 
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-stone-400">Supported formats: JPG, PNG, WEBP (Max 5MB file limit). The first slot is your display avatar.</p>
          </div>

          {/* Personal Traits */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b]">🧑 Personal Identity Traits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleTextChange} 
                  required
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Age</label>
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleTextChange} 
                    required 
                    min="18" 
                    max="80"
                    className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Gender</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleTextChange}
                    className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Height (cm)</label>
                  <input 
                    type="number" 
                    name="height" 
                    value={formData.height} 
                    onChange={handleTextChange} 
                    required 
                    className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Weight (kg)</label>
                  <input 
                    type="number" 
                    name="weight" 
                    value={formData.weight} 
                    onChange={handleTextChange} 
                    required 
                    className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">City</label>
                <select 
                  name="city" 
                  value={formData.city} 
                  onChange={handleTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">State</label>
                <select 
                  name="state" 
                  value={formData.state} 
                  onChange={handleTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Country</label>
                <input 
                  type="text" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleTextChange} 
                  required
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          {/* Religious details */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b]">🕋 Religious Alignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Sect (Firqa)</label>
                <select 
                  name="sect" 
                  value={formData.sect} 
                  onChange={handleTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  <option value="Sunni">Sunni</option>
                  <option value="Shia">Shia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Maslak</label>
                <input 
                  type="text" 
                  name="maslak" 
                  value={formData.maslak} 
                  placeholder="Deobandi, Barelvi, Ahl-i-Hadith, etc."
                  onChange={handleTextChange} 
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Religiosity level</label>
                <select 
                  name="religiosity" 
                  value={formData.religiosity} 
                  onChange={handleTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  <option value="Very Strict">Very Strict</option>
                  <option value="Strict">Strict / Practicing</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Liberal">Liberal / Balanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Daily Salah Frequency ({formData.salah}/5)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  name="salah" 
                  value={formData.salah} 
                  onChange={handleTextChange} 
                  className="w-full h-2 mt-4 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          {/* Parents & Background */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b]">👪 Family & Lineage Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Father's Full Name</label>
                <input 
                  type="text" 
                  name="fatherName" 
                  value={formData.fatherName} 
                  onChange={handleTextChange} 
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Father's Occupation</label>
                <input 
                  type="text" 
                  name="fatherOccupation" 
                  value={formData.fatherOccupation} 
                  onChange={handleTextChange} 
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Mother's Full Name</label>
                <input 
                  type="text" 
                  name="motherName" 
                  value={formData.motherName} 
                  onChange={handleTextChange} 
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          {/* Education / Career */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b]">💼 Academic & Career Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Highest Education Level</label>
                <select 
                  name="education" 
                  value={formData.education} 
                  onChange={handleTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  <option value="Bachelors">Bachelors</option>
                  <option value="Masters">Masters</option>
                  <option value="PhD">PhD / Doctorate</option>
                  <option value="Metric / High School">High School</option>
                  <option value="Other">Other Specialty</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Degree Designation / Institute</label>
                <input 
                  type="text" 
                  name="degreeName" 
                  value={formData.degreeName} 
                  onChange={handleTextChange} 
                  placeholder="e.g. B.Tech in CSE"
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Current Occupation</label>
                <input 
                  type="text" 
                  name="occupation" 
                  value={formData.occupation} 
                  onChange={handleTextChange} 
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Monthly Income (INR): ₹{parseInt(formData.salary as any).toLocaleString('en-IN')}</label>
                <input 
                  type="range" 
                  min="5000" 
                  max="300000" 
                  step="5000"
                  name="salary" 
                  value={formData.salary} 
                  onChange={handleTextChange} 
                  className="w-full h-2 mt-4 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          {/* Description / Hobbies */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#064e3b]">🎨 Interests & Description Details</h3>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Pick Your Hobbies</label>
              <div className="flex flex-wrap gap-2">
                {HOBBIES_LIST.map(hobby => {
                  const isActive = formData.hobbies.includes(hobby);
                  return (
                    <button 
                      key={hobby} 
                      type="button" 
                      onClick={() => toggleHobby(hobby)}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive ? 'bg-[#c5a059] border-[#c5a059] text-white' : 'bg-white border-[#e8e2d6] text-[#3d5a45] hover:bg-stone-50'}`}
                    >
                      {isActive ? '🌟 ' : ''}{hobby}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Sincerity / Likes description</label>
                <textarea 
                  name="likes" 
                  value={formData.likes} 
                  onChange={handleTextChange} 
                  rows={4}
                  placeholder="Elaborate what you value, your daily deen routines, and what makes you a great companion..."
                  className="w-full p-4 bg-white border border-[#e8e2d6] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Strict Dislikes & Mandates to avoid</label>
                <textarea 
                  name="dislikes" 
                  value={formData.dislikes} 
                  onChange={handleTextChange} 
                  rows={4}
                  placeholder="Identify strict dealsbreakers, non-negotiable items or things you wish to stay away from..."
                  className="w-full p-4 bg-white border border-[#e8e2d6] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          {/* Edit Match Preferences */}
          <div className="space-y-6 pt-6 border-t border-[#e8e2d6] bg-[#064e3b]/5 p-8 rounded-[2.5rem]">
            <h3 className="cinzel-font text-lg text-[#064e3b] font-black uppercase tracking-widest">💫 Mandate Partner Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Ideal Min Age</label>
                <input 
                  type="number" 
                  name="prefAgeMin" 
                  value={prefData.prefAgeMin} 
                  onChange={handlePrefTextChange} 
                  className="w-full p-3 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Ideal Max Age</label>
                <input 
                  type="number" 
                  name="prefAgeMax" 
                  value={prefData.prefAgeMax} 
                  onChange={handlePrefTextChange} 
                  className="w-full p-3 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Preferred Partner Sect</label>
                <select 
                  name="prefSect" 
                  value={prefData.prefSect} 
                  onChange={handlePrefTextChange}
                  className="w-full p-3.5 bg-white border border-[#e8e2d6] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                >
                  <option value="Sunni">Sunni</option>
                  <option value="Shia">Shia</option>
                  <option value="Any">Any Sect</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3d5a45]/60 block">Expected Income (Monthly INR+): ₹{parseInt(prefData.prefSalary as any).toLocaleString('en-IN')}</label>
                <input 
                  type="range" 
                  min="10000" 
                  max="300000" 
                  step="5000"
                  name="prefSalary" 
                  value={prefData.prefSalary} 
                  onChange={handlePrefTextChange} 
                  className="w-full h-2 mt-4 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" 
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="px-8 py-4 bg-stone-100 hover:bg-stone-200 text-[#3d5a45] rounded-full font-black uppercase tracking-wider text-xs active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-10 py-4 bg-[#064e3b] text-white hover:bg-[#043327] rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:shadow-2xl active:scale-95 transition-all"
            >
              {saving ? "Saving Changes..." : "Save My Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyProfileView;
