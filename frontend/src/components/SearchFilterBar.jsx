import React from 'react';
import { Search } from 'lucide-react';

export default function SearchFilterBar({ filters, setFilters, onSearch }) {
  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  return (
    <div className="card-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem', background: '#FFFFFF' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 120px',
        gap: '1.25rem',
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Room Category
          </label>
          <select 
            value={filters.type || ''} 
            onChange={(e) => handleChange('type', e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suite</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Max Rate (₹/night)
          </label>
          <input 
            type="number" 
            placeholder="e.g. 5000"
            value={filters.maxPrice || ''} 
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="input-field"
            min="1"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Sort By Price
          </label>
          <select 
            value={filters.sort || ''} 
            onChange={(e) => handleChange('sort', e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">Default (Featured)</option>
            <option value="pricePerNight">Price: Low to High</option>
            <option value="-pricePerNight">Price: High to Low</option>
          </select>
        </div>

        <button 
          type="button" 
          onClick={onSearch}
          className="btn btn-primary"
          style={{ height: '42px', width: '100%', padding: '0.5rem' }}
        >
          <Search size={16} />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
}
