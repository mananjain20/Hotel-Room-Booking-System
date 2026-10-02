import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI, formatCurrency } from '../services/api';
import BookingModal from '../components/BookingModal';
import { Bed, Users, ShieldCheck, ArrowLeft, Calendar } from 'lucide-react';
import standardImg from '../assets/standard-room.jpg';
import deluxeImg from '../assets/deluxe-room.jpg';
import suiteImg from '../assets/suite-room.jpg';

const roomImages = {
  standard: standardImg,
  deluxe: deluxeImg,
  suite: suiteImg,
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await roomAPI.getRoomById(id);
        if (res.success && res.data) {
          setRoom(res.data);
        }
      } catch (err) {
        setError(err.message || 'Room details could not be found.');
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Loading suite specifications...</div>;
  }

  if (error || !room) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-rose)' }}>{error || 'Room not found'}</h2>
        <button onClick={() => navigate('/rooms')} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to All Rooms</span>
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      <button 
        onClick={() => navigate('/rooms')} 
        className="btn btn-secondary" 
        style={{ marginBottom: '2rem', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={15} />
        <span>Back to Catalog</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div>
          {/* Room Photo */}
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
            <img
              src={roomImages[room.type?.toLowerCase()] || standardImg}
              alt={`${room.type} Room`}
              onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'var(--bg-secondary)'; }}
              style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Main Room Card */}
          <div className="card-panel" style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '2.25rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-deluxe">
                {room.type} Suite
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>
                ROOM {room.roomNumber}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: '700', color: 'var(--accent-black)', marginBottom: '0.5rem' }}>
              {room.type} Room {room.roomNumber}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Manan Palace Luxury Collection
            </p>

            <div style={{ display: 'flex', gap: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Users size={18} color="var(--text-muted)" />
                <span>Max Capacity: <strong>{room.capacity} Guests</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Bed size={18} color="var(--text-muted)" />
                <span>King Bed Luxury Suite</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card-panel" style={{ padding: '2rem', marginBottom: '2rem', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--accent-black)', fontFamily: 'var(--font-serif)' }}>
              Room Overview & Details
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.925rem' }}>
              {room.description || 'This thoughtfully curated suite features high ceilings, elegant woodwork, plush king-size bedding, a spacious marble-tiled bath, climate control, and high-speed Wi-Fi.'}
            </p>
          </div>

          {/* Amenities */}
          <div className="card-panel" style={{ padding: '2rem', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--accent-black)', fontFamily: 'var(--font-serif)' }}>
              Complimentary Amenities
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <div>✓ High-Speed Wi-Fi</div>
              <div>✓ 24-Hour Concierge Desk</div>
              <div>✓ Daily Housekeeping</div>
              <div>✓ In-Room Coffee & Tea Service</div>
              <div>✓ Climate Control & Flat-Screen TV</div>
              <div>✓ Dedicated Work Desk</div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="card-panel" style={{ padding: '2rem', position: 'sticky', top: '5.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--accent-black)' }}>
                {formatCurrency(room.pricePerNight)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}> / night</span>
            </div>
            <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: '600' }}>
              ● Available
            </span>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
              <ShieldCheck size={16} color="var(--text-muted)" />
              <span>Real-time availability protection</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span>Instant booking confirmation</span>
            </div>
          </div>

          <button 
            onClick={() => setShowBookingModal(true)} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
          >
            Reserve This Room
          </button>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal 
          room={room} 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
            navigate('/my-bookings');
          }} 
        />
      )}
    </div>
  );
}
