import React, { useState } from 'react';

interface FilterSectionProps {
  onApply: (filters: {
    ageRange: string;
    sect: string;
    height: string;
    location: string;
    education: string;
    religiosity: string;
  }) => void;
  appliedFilters: {
    ageRange: string;
    sect: string;
    height: string;
    location: string;
    education: string;
    religiosity: string;
  };
  onClear: () => void;
  isVanished: boolean;
  onToggleVanished: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  onApply,
  appliedFilters,
  onClear,
  isVanished,
  onToggleVanished
}) => {
  const [localFilters, setLocalFilters] = useState({ ...appliedFilters });

  const handleSelectChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const activeLabels = Object.entries(appliedFilters)
    .filter(([_, val]) => !!val)
    .map(([key, val]) => {
      const labelName = key === 'ageRange' ? 'Age' : key.charAt(0).toUpperCase() + key.slice(1);
      return `${labelName}: ${val}`;
    });

  if (isVanished) {
    return (
      <div className="flex justify-end mb-6 animate-fade-in pointer-events-auto">
        <button 
          type="button"
          onClick={onToggleVanished}
          className="py-3 px-5 rounded-full border shadow-lg transition-all active:scale-95 flex items-center justify-center bg-white/95 text-[#3d5a45] border-[#c5a059]/30 hover:bg-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.22em]"
        >
          Modify Filters
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/60 p-8 md:p-10 rounded-[2.5rem] border border-[#e8e2d6] shadow-sm backdrop-blur-md mb-12 animate-fade-down">
      <div className="flex justify-between items-center mb-6">
        <h3 className="serif-heading text-xl text-[#064e3b] font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Nikah Profiles
        </h3>
        
        {activeLabels.length > 0 && (
          <button 
            type="button"
            onClick={onToggleVanished}
            className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest hover:underline"
          >
            Keep Active & Hide ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <FilterSelect 
          label="Age Range" 
          value={localFilters.ageRange}
          onChange={(val) => handleSelectChange('ageRange', val)}
          options={['18-25', '26-35', '36-45', '45+']} 
        />
        <FilterSelect 
          label="Sect" 
          value={localFilters.sect}
          onChange={(val) => handleSelectChange('sect', val)}
          options={['Sunni', 'Shia', 'Other']} 
        />
        <FilterSelect 
          label="Height" 
          value={localFilters.height}
          onChange={(val) => handleSelectChange('height', val)}
          options={['<160cm', '160-175cm', '175cm+']} 
        />
        <FilterSelect 
          label="Location" 
          value={localFilters.location}
          onChange={(val) => handleSelectChange('location', val)}
          options={['Local (India)', 'International']} 
        />
        <FilterSelect 
          label="Education" 
          value={localFilters.education}
          onChange={(val) => handleSelectChange('education', val)}
          options={['Bachelors', 'Masters', 'PHD', 'High School']} 
        />
        <FilterSelect 
          label="Religiosity" 
          value={localFilters.religiosity}
          onChange={(val) => handleSelectChange('religiosity', val)}
          options={['Strict', 'Moderate', 'Liberal']} 
        />
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-[#e8e2d6]/45 pt-6">
        {activeLabels.length > 0 && (
          <button 
            type="button"
            onClick={() => {
              const cleared = {
                ageRange: '',
                sect: '',
                height: '',
                location: '',
                education: '',
                religiosity: '',
              };
              setLocalFilters(cleared);
              onClear();
            }}
            className="text-[#3d5a45]/60 hover:text-red-500 text-xs font-black uppercase tracking-widest px-6 py-3 hover:bg-black/5 rounded-full transition-all"
          >
            Reset
          </button>
        )}
        <button 
          type="button"
          onClick={handleApply}
          className="bg-[#c5a059] text-white px-8 py-3 rounded-full font-bold tracking-widest hover:bg-[#b08e4d] transition-all shadow-lg text-xs uppercase"
        >
          Apply & Fed Filters
        </button>
      </div>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, onChange, options }) => (
  <div className="space-y-2 text-left">
    <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest opacity-60">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c5a059] text-xs font-bold text-[#3d5a45]"
    >
      <option value="">Any</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default FilterSection;
