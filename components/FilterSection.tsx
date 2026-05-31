import React from 'react';

const FilterSection: React.FC = () => {
  return (
    <div className="bg-white/60 p-8 rounded-[2.5rem] border border-[#e8e2d6] shadow-sm backdrop-blur-md mb-12">
      <h3 className="serif-heading text-xl text-[#064e3b] font-bold mb-6 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        Filter Profiles
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <FilterSelect label="Age Range" options={['18-25', '26-35', '36-45', '45+']} />
        <FilterSelect label="Sect" options={['Sunni', 'Shia', 'Other']} />
        <FilterSelect label="Height" options={['<160cm', '160-175cm', '175cm+']} />
        <FilterSelect label="Location" options={['Local (25km)', 'Local (50km)', 'National', 'International']} />
        <FilterSelect label="Education" options={['Bachelors', 'Masters', 'PHD', 'High School']} />
        <FilterSelect label="Religiosity" options={['Casual', 'Moderate', 'Strict']} />
      </div>
      <div className="mt-8 flex justify-end">
        <button className="bg-[#c5a059] text-white px-8 py-3 rounded-full font-bold tracking-widest hover:bg-[#b08e4d] transition-all shadow-lg text-sm uppercase">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

const FilterSelect: React.FC<{ label: string; options: string[] }> = ({ label, options }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest opacity-60">{label}</label>
    <select className="w-full bg-[#fdfbf7] border border-[#e8e2d6] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c5a059] text-sm text-[#3d5a45]">
      <option value="">Any</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default FilterSection;