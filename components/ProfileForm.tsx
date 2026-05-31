import React, { useState, useEffect, useRef } from 'react';

interface ProfileFormProps {
  onComplete: (formData: any, prefData: any) => void;
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

const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Identity Selection, 1-4: Form Steps
  const [showPreferences, setShowPreferences] = useState(false);
  const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    city: '',
    state: '',
    country: 'India',
    height: '',
    weight: '',
    sect: '',
    maslak: '',
    firqa: '',
    religiosity: '',
    salah: 3,
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    occupation: '',
    education: '',
    degreeName: '',
    salary: 10000,
    hobbies: [] as string[],
    likes: '',
    dislikes: '',
  });

  const [prefData, setPrefData] = useState({
    prefGender: '',
    prefAgeMin: 20,
    prefAgeMax: 40,
    prefCountry: '',
    prefState: '',
    prefHeightMin: 140,
    prefHeightMax: 200,
    prefWeightMin: 40,
    prefWeightMax: 120,
    prefSect: '',
    prefFirqa: '',
    prefReligiosity: '',
    prefSalah: 5,
    prefEducation: '',
    prefSalary: 20000,
  });

  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);

  const uploadedCount = images.filter(img => img !== null).length;

  const handleIdentitySelect = (gender: 'male' | 'female') => {
    setFormData(prev => ({ ...prev, gender }));
    setPrefData(prev => ({ ...prev, prefGender: gender === 'male' ? 'female' : 'male' }));
    setStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrefChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      return false;
    }
    if (file.size > maxSize) {
      setUploadError("The image file size exceeds the 5MB limit.");
      return false;
    }
    setUploadError(null);
    return true;
  };

  const processFile = (index: number, file: File) => {
    if (!validateFile(file)) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (index: number) => {
    if (images[index]) return; 
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
    setUploadError(null);
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(index, file);
  };

  const handleDrag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveIndex(index);
    } else if (e.type === "dragleave") {
      setDragActiveIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(index, e.dataTransfer.files[0]);
    }
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedCount < 3) {
      setUploadError("Verification Failed: A minimum of 3 profile pictures are required to continue.");
      // Scroll to error
      const errorEl = document.getElementById('upload-error-display');
      if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const finalFormData = {
      ...formData,
      // If some values are objects or arrays, keep them
      name: formData.fullName, // Make sure 'name' property is also populated if expected
      image: images.find(img => img !== null) || '',
      images: images.filter(img => img !== null)
    };
    onComplete(finalFormData, prefData);
  };

  if (step === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in py-12 px-4">
        <h2 className="serif-heading text-4xl md:text-5xl text-[#064e3b] mb-12 text-center font-bold">Who are you?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
          <SelectionCard 
            title="Male" 
            image="https://images.unsplash.com/photo-1620573994323-5e921d18728d?q=80&w=1974&auto=format&fit=crop"
            onClick={() => handleIdentitySelect('male')}
          />
          <SelectionCard 
            title="Female" 
            image="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=1974&auto=format&fit=crop"
            onClick={() => handleIdentitySelect('female')}
          />
        </div>
        <p className="mt-16 text-[#3d5a45]/60 amiri-font text-xl italic text-center">“Dignity, faith, and sincerity begin with a clear intention.”</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-40 px-4 md:px-0">
      {/* Progress Stepper */}
      {!showPreferences && (
        <div className="mb-12 flex items-center justify-between gap-2 px-2 md:px-4">
          {[1, 2, 3, 4].map(num => (
            <div key={num} className="flex-1 flex flex-col items-center gap-2">
              <div className={`h-1.5 w-full rounded-full transition-all duration-700 ${step >= num ? 'bg-[#c5a059]' : 'bg-[#e8e2d6]'}`}></div>
              <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${step >= num ? 'text-[#c5a059]' : 'text-[#3d5a45]/30'}`}>
                {num === 1 ? 'Personal' : num === 2 ? 'Faith' : num === 3 ? 'Professional' : 'Finalize'}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmitFinal} className="bg-white/70 backdrop-blur-2xl p-6 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-[#e8e2d6] shadow-2xl space-y-12 md:space-y-16 animate-fade-up overflow-hidden">
        
        {step === 1 && (
          <div className="space-y-8 md:space-y-12 animate-fade-in">
            <header className="border-b border-[#c5a059]/20 pb-6 md:pb-8">
              <h3 className="serif-heading text-2xl md:text-3xl text-[#064e3b] flex items-center gap-3">
                <span className="text-xl md:text-2xl">۞</span> Personal Information
              </h3>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-8">
              <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" required />
              <Input label="Gender" name="gender" value={formData.gender} readOnly className="bg-[#e8e2d6]/30 cursor-not-allowed capitalize" />
              
              <Input label="Age" name="age" type="number" min="18" max="100" value={formData.age} onChange={handleChange} placeholder="Enter your age (e.g. 24)" required />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Height (cm)" name="height" type="number" value={formData.height} onChange={handleChange} placeholder="e.g. 175" required />
                <Input label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="e.g. 70" required />
              </div>
              
              {/* India-considerate City and State Location details */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest opacity-80">Location (India)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input 
                      list="indian-cities-list" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange} 
                      placeholder="City" 
                      className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:outline-none transition-all placeholder:text-[#3d5a45]/30 text-sm" 
                      required 
                    />
                    <span className="text-[10px] text-[#3d5a45]/40 font-bold uppercase tracking-wider px-1">City</span>
                    <datalist id="indian-cities-list">
                      {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </datalist>
                  </div>
                  
                  <div className="space-y-1">
                    <input 
                      list="indian-states-list" 
                      name="state" 
                      value={formData.state || ''} 
                      onChange={handleChange} 
                      placeholder="State" 
                      className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:outline-none transition-all placeholder:text-[#3d5a45]/30 text-sm" 
                      required 
                    />
                    <span className="text-[10px] text-[#3d5a45]/40 font-bold uppercase tracking-wider px-1">State</span>
                    <datalist id="indian-states-list">
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full py-5 md:py-6 bg-[#064e3b] text-white rounded-full font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#043327] transition-all text-sm md:text-base">Continue to Faith & Practice</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 md:space-y-12 animate-fade-up">
            <header className="border-b border-[#c5a059]/20 pb-6 md:pb-8">
              <h3 className="serif-heading text-2xl md:text-3xl text-[#064e3b] flex items-center gap-3">
                <span className="text-xl md:text-2xl">۞</span> Faith & Practice
              </h3>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Sect</label>
                <select name="sect" value={formData.sect} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all" required>
                  <option value="">Select Sect</option>
                  <option value="Sunni">Sunni</option>
                  <option value="Shia">Shia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Maslak</label>
                <input 
                  list="maslak-list"
                  name="maslak" 
                  value={formData.maslak} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, maslak: val, firqa: val }));
                  }} 
                  placeholder="Enter or select your Maslak" 
                  className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all placeholder:text-[#3d5a45]/30 text-sm" 
                  required 
                />
                <datalist id="maslak-list">
                  <option value="Ahl-e-Hadees" />
                  <option value="Deobandi" />
                  <option value="Barelvi" />
                  <option value="Qadiani" />
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Religiosity Level</label>
                <select name="religiosity" value={formData.religiosity} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all" required>
                  <option value="">Select Level</option>
                  <option value="Casual">Casual</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Strict">Strict</option>
                </select>
              </div>

              <div className="space-y-6 md:col-span-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Salah Frequency</label>
                  <span className="text-[#c5a059] font-bold">{formData.salah} times/day</span>
                </div>
                <input type="range" min="1" max="5" value={formData.salah} onChange={(e) => setFormData(prev => ({ ...prev, salah: parseInt(e.target.value) }))} className="w-full h-2 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                <div className="flex justify-between text-[10px] text-[#3d5a45]/40 font-bold uppercase tracking-tighter">
                  <span>1 Time</span>
                  <span>5 Times</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button type="button" onClick={() => setStep(1)} className="w-full md:flex-1 py-4 md:py-5 border-2 border-[#064e3b] text-[#064e3b] rounded-full font-black uppercase tracking-widest hover:bg-[#064e3b]/5 transition-all text-xs md:text-sm">Back</button>
              <button type="button" onClick={() => setStep(3)} className="w-full md:flex-[2] py-4 md:py-5 bg-[#064e3b] text-white rounded-full font-black uppercase tracking-widest shadow-xl hover:bg-[#043327] transition-all text-xs md:text-sm">Continue to Family & Work</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 md:space-y-12 animate-fade-up">
            <header className="border-b border-[#c5a059]/20 pb-6 md:pb-8">
              <h3 className="serif-heading text-2xl md:text-3xl text-[#064e3b] flex items-center gap-3">
                <span className="text-xl md:text-2xl">۞</span> Education & Family
              </h3>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-8">
              <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} required />
              <Input label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} required />
              <Input label="Father's Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} required />
              
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Education</label>
                <select name="education" value={formData.education} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all" required>
                  <option value="">Select Education</option>
                  <option value="Bachelors">Bachelors</option>
                  <option value="Masters">Masters</option>
                  <option value="PhD">PhD</option>
                  <option value="High School">High School</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {['Bachelors', 'Masters', 'PhD', 'High School', 'Other'].includes(formData.education) && (
                <div className="space-y-2 animate-fade-in md:col-span-2">
                  <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Degree Name (Placeholder)</label>
                  <input 
                    type="text" 
                    name="degreeName" 
                    value={formData.degreeName || ''} 
                    onChange={handleChange} 
                    placeholder="e.g. Bachelors in Chemistry, BSC Chemistry, MA in Mathematics, Masters in Economics" 
                    className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:outline-none transition-all text-sm" 
                    required 
                  />
                </div>
              )}

              <Input label="Personal Occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />

              <div className="space-y-6 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Monthly Salary (INR)</label>
                  <span className="text-[#064e3b] text-xl md:text-2xl font-black">₹{formData.salary.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="500000" 
                  step="10000" 
                  value={formData.salary} 
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: parseInt(e.target.value) }))} 
                  className="w-full h-3 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#064e3b]" 
                />
                <div className="flex justify-between text-[10px] text-[#3d5a45]/40 font-bold uppercase">
                  <span>₹10,000</span>
                  <span>₹5,00,000+</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button type="button" onClick={() => setStep(2)} className="w-full md:flex-1 py-4 md:py-5 border-2 border-[#064e3b] text-[#064e3b] rounded-full font-black uppercase tracking-widest hover:bg-[#064e3b]/5 transition-all text-xs md:text-sm">Back</button>
              <button type="button" onClick={() => setStep(4)} className="w-full md:flex-[2] py-4 md:py-5 bg-[#064e3b] text-white rounded-full font-black uppercase tracking-widest shadow-xl hover:bg-[#043327] transition-all text-xs md:text-sm">Continue to Preferences</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 md:space-y-12 animate-fade-up">
            <header className="border-b border-[#c5a059]/20 pb-6 md:pb-8">
              <h3 className="serif-heading text-2xl md:text-3xl text-[#064e3b] flex items-center gap-3">
                <span className="text-xl md:text-2xl">۞</span> Personal Preferences & Photos
              </h3>
            </header>
            
            <div className="space-y-4">
              <label className="block text-xs font-black text-[#3d5a45] uppercase tracking-widest">Hobbies & Interests</label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {HOBBIES_LIST.map(hobby => (
                  <button 
                    key={hobby}
                    type="button"
                    onClick={() => toggleHobby(hobby)}
                    className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full border text-[10px] md:text-xs font-bold transition-all ${formData.hobbies.includes(hobby) ? 'bg-[#c5a059] border-[#c5a059] text-white' : 'bg-white border-[#e8e2d6] text-[#3d5a45] hover:border-[#c5a059]'}`}
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <textarea name="likes" value={formData.likes} onChange={handleChange} placeholder="What do you like? (Optional)" className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 md:p-6 rounded-3xl h-32 focus:ring-2 focus:ring-[#c5a059] transition-all text-sm"></textarea>
              <textarea name="dislikes" value={formData.dislikes} onChange={handleChange} placeholder="What do you dislike? (Optional)" className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-4 md:p-6 rounded-3xl h-32 focus:ring-2 focus:ring-[#c5a059] transition-all text-sm"></textarea>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 bg-[#fdfbf7] p-6 rounded-3xl border border-[#e8e2d6]">
                <div className="space-y-4 flex-grow">
                  <h4 className="text-lg md:text-xl font-black text-[#064e3b] flex items-center gap-2">
                    <span className="text-[#c5a059]">✦</span> Profile Photos
                  </h4>
                  <ul className="space-y-2">
                    <li className={`flex items-center gap-3 text-[11px] font-bold transition-colors ${uploadedCount >= 3 ? 'text-green-600' : 'text-[#3d5a45]/60'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${uploadedCount >= 3 ? 'bg-green-100 border-green-600 scale-110' : 'border-[#e8e2d6]'}`}>
                        {uploadedCount >= 3 ? '✓' : ''}
                      </span>
                      Mandatory: Minimum 3 profile photos (Supports URL or Device Upload)
                    </li>
                    <li className="flex items-center gap-3 text-[11px] font-bold text-[#3d5a45]/60">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#e8e2d6]">i</span>
                      Formats: JPG, PNG, WEBP (Max 5MB)
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center bg-white px-8 py-4 rounded-2xl border border-[#e8e2d6] shadow-sm min-w-[140px]">
                   <span className="text-[10px] font-black uppercase text-[#3d5a45]/40 mb-1">Status</span>
                   <span className={`text-2xl font-black transition-all ${uploadedCount >= 3 ? 'text-[#064e3b]' : 'text-red-500'}`}>
                    {uploadedCount} / 5
                   </span>
                   <span className={`text-[9px] font-bold uppercase mt-1 ${uploadedCount >= 3 ? 'text-green-600' : 'text-red-400'}`}>
                    {uploadedCount >= 3 ? 'Requirement Met' : 'Incomplete'}
                   </span>
                </div>
              </div>

              {uploadError && (
                <div id="upload-error-display" className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl text-[12px] font-black border-2 border-red-100 animate-fade-in flex items-center gap-4">
                  <div className="bg-red-200 text-red-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">!</div>
                  <p>{uploadError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                {images.map((img, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div 
                      onClick={() => handleImageClick(i)}
                      onDragEnter={(e) => handleDrag(e, i)}
                      onDragLeave={(e) => handleDrag(e, i)}
                      onDragOver={(e) => handleDrag(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      className={`aspect-[4/5] rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all flex items-center justify-center relative group ${img ? 'border-[#064e3b] shadow-xl ring-4 ring-[#064e3b]/5' : dragActiveIndex === i ? 'border-[#c5a059] bg-[#c5a059]/10 animate-pulse-soft scale-105 z-10' : 'border-[#e8e2d6] hover:border-[#c5a059] bg-[#fdfbf7]'}`}
                    >
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        className="hidden" 
                        ref={el => { fileInputRefs.current[i] = el; }}
                        onChange={(e) => handleFileChange(i, e)}
                      />
                      {img ? (
                        <>
                          <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 animate-fade-in" referrerPolicy="no-referrer" />
                          <div className="absolute top-3 right-3 bg-green-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20 animate-fade-in">
                             <span className="text-[12px] font-bold">✓</span>
                          </div>
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 px-2">
                             <button 
                               type="button"
                               onClick={(e) => { e.stopPropagation(); fileInputRefs.current[i]?.click(); }}
                               className="w-full bg-white/20 hover:bg-white/40 backdrop-blur-md py-2.5 rounded-xl text-[10px] text-white font-black uppercase tracking-widest border border-white/30"
                             >
                               Change
                             </button>
                             <button 
                               type="button"
                               onClick={(e) => removeImage(i, e)}
                               className="w-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md py-2.5 rounded-xl text-[10px] text-white font-black uppercase tracking-widest border border-red-400/30"
                             >
                               Remove
                             </button>
                          </div>
                        </>
                      ) : (
                        <div className={`text-center px-2 transition-all duration-500 ${dragActiveIndex === i ? 'scale-110' : ''}`}>
                          <div className={`w-10 h-10 mx-auto rounded-full border-2 flex items-center justify-center mb-2 transition-colors ${dragActiveIndex === i ? 'border-[#c5a059] text-[#c5a059]' : 'border-[#e8e2d6] text-[#e8e2d6]'}`}>
                            <span className="text-xl transition-transform group-hover:scale-125">+</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase leading-tight tracking-[0.1em] transition-colors ${dragActiveIndex === i ? 'text-[#c5a059]' : 'text-[#3d5a45]/30'}`}>
                            {dragActiveIndex === i ? 'Drop Photo' : 'Device Upload'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!img && (
                      <input 
                        type="text" 
                        placeholder="Or Paste URL" 
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.trim()) {
                            const newImages = [...images];
                            newImages[i] = val.trim();
                            setImages(newImages);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val.trim()) {
                            const newImages = [...images];
                            newImages[i] = val.trim();
                            setImages(newImages);
                          }
                        }}
                        className="w-full bg-[#fdfbf7] border border-[#e8e2d6] px-2 py-1.5 rounded-xl text-[10px] text-[#3d5a45] text-center focus:outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-[#3d5a45]/30 transition-all font-semibold"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 md:pt-10 border-t border-[#e8e2d6] space-y-6 md:space-y-8">
              <div className="flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="group flex items-center gap-3 md:gap-4 py-3 md:py-4 px-6 md:px-10 rounded-full border-2 border-[#c5a059] text-[#c5a059] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] hover:bg-[#c5a059] hover:text-white transition-all duration-500 shadow-lg text-xs md:text-sm"
                >
                  <span>{showPreferences ? '−' : '🔘'}</span> Standardize Your Preferences
                </button>
                <p className="mt-4 text-[10px] md:text-xs text-[#3d5a45]/60 font-medium italic text-center px-2">Set your preferred criteria to see Nikah profiles aligned with your expectations.</p>
              </div>

              {/* Preferences Panel */}
              <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showPreferences ? 'max-h-[5000px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[#fdfbf7] p-5 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-[#c5a059]/20 shadow-inner space-y-8 md:space-y-12">
                  <header className="flex items-center gap-3 md:gap-4">
                    <span className="text-[#c5a059] text-lg md:text-2xl">۞</span>
                    <h3 className="serif-heading text-lg md:text-2xl text-[#064e3b]">Matching Criteria</h3>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-8 md:gap-y-12">
                    {/* Basic Preferences */}
                    <div className="space-y-5 md:space-y-6">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">Basic Preferences</h4>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Preferred Gender</label>
                        <select name="prefGender" value={prefData.prefGender} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 md:p-4 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all text-sm">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Age Range</label>
                          <span className="text-[9px] md:text-xs font-bold text-[#c5a059]">{prefData.prefAgeMin} — {prefData.prefAgeMax} years</span>
                        </div>
                        <div className="flex gap-3 md:gap-4 items-center">
                          <input type="range" name="prefAgeMin" min="18" max="60" value={prefData.prefAgeMin} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                          <input type="range" name="prefAgeMax" min="18" max="60" value={prefData.prefAgeMax} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                        </div>
                      </div>
                    </div>

                    {/* Preferred Location */}
                    <div className="space-y-5 md:space-y-6">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">Location Preferences</h4>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Preferred Country</label>
                        <select name="prefCountry" value={prefData.prefCountry} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 md:p-4 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all text-sm">
                          <option value="">Any Country</option>
                          <option value="India">India</option>
                          <option value="Pakistan">Pakistan</option>
                          <option value="UAE">UAE</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {prefData.prefCountry === 'India' && (
                        <div className="space-y-2 animate-fade-in">
                          <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Preferred State</label>
                          <select name="prefState" value={prefData.prefState} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 md:p-4 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all text-sm">
                            <option value="">Any State</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Physical Preferences */}
                    <div className="space-y-5 md:space-y-6">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">Physical Attributes</h4>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Height Range (cm)</label>
                          <span className="text-[9px] md:text-xs font-bold text-[#c5a059]">{prefData.prefHeightMin} — {prefData.prefHeightMax} cm</span>
                        </div>
                        <div className="flex gap-3 md:gap-4 items-center">
                          <input type="range" name="prefHeightMin" min="140" max="220" value={prefData.prefHeightMin} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                          <input type="range" name="prefHeightMax" min="140" max="220" value={prefData.prefHeightMax} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Weight Range (kg)</label>
                          <span className="text-[9px] md:text-xs font-bold text-[#c5a059]">{prefData.prefWeightMin} — {prefData.prefWeightMax} kg</span>
                        </div>
                        <div className="flex gap-3 md:gap-4 items-center">
                          <input type="range" name="prefWeightMin" min="40" max="150" value={prefData.prefWeightMin} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                          <input type="range" name="prefWeightMax" min="40" max="150" value={prefData.prefWeightMax} onChange={handlePrefChange} className="flex-1 h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                        </div>
                      </div>
                    </div>

                    {/* Faith & Practice Preferences */}
                    <div className="space-y-5 md:space-y-6">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">Faith & Practice</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Sect</label>
                          <select name="prefSect" value={prefData.prefSect} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 rounded-xl text-xs">
                            <option value="">Any</option>
                            <option value="Sunni">Sunni</option>
                            <option value="Shia">Shia</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Religiosity</label>
                          <select name="prefReligiosity" value={prefData.prefReligiosity} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 rounded-xl text-xs">
                            <option value="">Any</option>
                            <option value="Casual">Casual</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Strict">Strict</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Min. Salah Frequency</label>
                          <span className="text-[9px] md:text-xs font-bold text-[#c5a059]">{prefData.prefSalah}+ times/day</span>
                        </div>
                        <input type="range" name="prefSalah" min="1" max="5" value={prefData.prefSalah} onChange={handlePrefChange} className="w-full h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#c5a059]" />
                      </div>
                    </div>

                    {/* Education & Financial Preferences */}
                    <div className="space-y-5 md:space-y-6 md:col-span-2">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">Professional & Financial</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Education Level</label>
                          <select name="prefEducation" value={prefData.prefEducation} onChange={handlePrefChange} className="w-full bg-white border border-[#e8e2d6] p-3 md:p-4 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[#c5a059] transition-all text-sm">
                            <option value="">Any Level</option>
                            <option value="Graduate">Graduate+</option>
                            <option value="Undergraduate">Undergraduate+</option>
                            <option value="PhD">PhD</option>
                          </select>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="block text-[9px] md:text-[10px] font-black text-[#3d5a45] uppercase tracking-widest">Min. Salary (INR)</label>
                            <span className="text-xs md:text-sm font-black text-[#064e3b]">₹{prefData.prefSalary.toLocaleString()}</span>
                          </div>
                          <input type="range" name="prefSalary" min="10000" max="500000" step="10000" value={prefData.prefSalary} onChange={handlePrefChange} className="w-full h-1.5 bg-[#e8e2d6] rounded-lg appearance-none cursor-pointer accent-[#064e3b]" />
                          <div className="flex justify-between text-[8px] text-[#3d5a45]/40 font-black uppercase tracking-tighter">
                            <span>₹10,000</span>
                            <span>₹5L+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 md:pt-8 text-center flex flex-col items-center">
                    <button 
                      type="submit"
                      className="group flex items-center justify-center gap-2 md:gap-4 py-4 md:py-5 px-5 md:px-16 bg-[#c5a059] text-white rounded-full font-black uppercase tracking-[0.1em] md:tracking-[0.3em] hover:bg-[#b08e4d] transition-all duration-500 shadow-2xl w-full max-w-sm md:max-w-none md:mx-auto text-[10px] md:text-sm"
                    >
                      <span>🔘</span> <span className="whitespace-nowrap">Standardize These Preferences</span>
                    </button>
                    <p className="mt-5 text-[8px] md:text-[10px] text-[#3d5a45]/40 font-medium uppercase tracking-widest leading-relaxed max-w-lg mx-auto px-4 text-center">
                      These settings ensure your browsing experience is focused only on sincere matches who align with your sacred union goals.
                    </p>
                  </div>
                </div>
              </div>

              {!showPreferences && (
                <div className="flex flex-col md:flex-row gap-4 pt-10">
                  <button type="button" onClick={() => setStep(3)} className="w-full md:flex-1 py-4 md:py-6 border-2 border-[#064e3b] text-[#064e3b] rounded-full font-black uppercase tracking-widest hover:bg-[#064e3b]/5 transition-all text-xs md:text-sm">Back</button>
                  <button 
                    type="submit" 
                    disabled={uploadedCount < 3}
                    className={`w-full md:flex-[3] py-4 md:py-6 rounded-full font-black uppercase tracking-[0.15em] md:tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 text-xs md:text-sm ${uploadedCount >= 3 ? 'bg-[#064e3b] text-[#fdfbf7] hover:bg-[#043327] hover:scale-[1.02] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-80'}`}
                  >
                    {uploadedCount >= 3 ? 'Complete My Amanah Profile' : `Add ${3 - uploadedCount} more photo${uploadedCount === 2 ? '' : 's'} to finish`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

const SelectionCard: React.FC<{ title: string; image: string; onClick: () => void }> = ({ title, image, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative h-72 md:h-96 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_40px_100px_-20px_rgba(6,78,59,0.3)] border-2 border-transparent hover:border-[#c5a059]/30"
  >
    <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
    <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-10 pb-10 md:pb-12">
      <span className="cinzel-font text-4xl md:text-5xl text-white font-black tracking-[0.1em] uppercase group-hover:tracking-[0.2em] transition-all">{title}</span>
      <div className="mt-4 h-1 w-0 bg-[#c5a059] group-hover:w-20 transition-all duration-700"></div>
    </div>
  </button>
);

const Input: React.FC<{ label: string; name: string; value: string; onChange?: any; type?: string; required?: boolean; placeholder?: string; readOnly?: boolean; className?: string; [key: string]: any }> = ({ label, name, value, onChange, type = 'text', required = false, placeholder, readOnly, className, ...props }) => (
  <div className="space-y-2">
    <label className="block text-[10px] md:text-xs font-black text-[#3d5a45] uppercase tracking-widest opacity-80">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      required={required}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full bg-[#fdfbf7] border border-[#e8e2d6] p-3 md:p-4 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:outline-none transition-all placeholder:text-[#3d5a45]/20 text-sm ${className}`}
      {...props}
    />
  </div>
);

export default ProfileForm;