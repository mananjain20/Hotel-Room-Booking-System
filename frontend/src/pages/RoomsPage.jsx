import React, { useState, useEffect } from 'react';
import { roomAPI } from '../services/api';
import RoomCard from '../components/RoomCard';
import SearchFilterBar from '../components/SearchFilterBar';
import BookingModal from '../components/BookingModal';
import { ChevronLeft, ChevronRight, BedDouble } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 6, totalPages: 1 });
  const [filters, setFilters] = useState({ type: '', maxPrice: '', sort: '', page: 1, limit: 6 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await roomAPI.getRooms(filters);
      if (res.success) {
        setRooms(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError(err.message || 'Unable to connect to Manan Palace room catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filters.page, filters.type, filters.maxPrice, filters.sort]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '0.5rem'
        }}>
          Manan Palace Accommodations
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-black)', marginBottom: '0.75rem' }}>
          Rooms & Luxury Suites
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', fontSize: '0.95rem' }}>
          Select from our collection of thoughtfully appointed rooms. Filter by room category or night rate to find your stay.
        </p>
      </div>

      <SearchFilterBar 
        filters={filters} 
        setFilters={setFilters} 
        onSearch={fetchRooms} 
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
          Loading available rooms...
        </div>
      ) : error ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-rose)' }}>
            Error Loading Accommodations
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button 
            onClick={fetchRooms} 
            className="btn btn-primary"
          >
            Retry Loading Rooms
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF' }}>
          <BedDouble size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-black)' }}>
            No Accommodations Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            No rooms match your current search criteria. Try modifying your filter options.
          </p>
          <button 
            onClick={() => setFilters({ type: '', maxPrice: '', sort: '', page: 1, limit: 6 })} 
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
            marginBottom: '3.5rem'
          }}>
            {rooms.map(room => (
              <RoomCard 
                key={room._id} 
                room={room} 
                onBook={(r) => setSelectedRoom(r)} 
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>
                Page <strong style={{ color: 'var(--accent-black)' }}>{pagination.page}</strong> of {pagination.totalPages}
              </span>

              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {selectedRoom && (
        <BookingModal 
          room={selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
          onSuccess={() => setSelectedRoom(null)} 
        />
      )}
    </div>
  );
}
