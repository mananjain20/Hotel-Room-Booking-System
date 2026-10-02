import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../services/api';
import standardImg from '../assets/standard-room.jpg';
import deluxeImg from '../assets/deluxe-room.jpg';
import suiteImg from '../assets/suite-room.jpg';

const roomImages = {
  standard: standardImg,
  deluxe: deluxeImg,
  suite: suiteImg,
};

export default function RoomCard({ room, onBook }) {
  const getBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'suite': return 'badge-suite';
      case 'deluxe': return 'badge-deluxe';
      default: return 'badge-standard';
    }
  };

  return (
    <div className="card-panel" style={{
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF'
    }}>
      {/* Room Photo Header */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img
          src={roomImages[room.type?.toLowerCase()] || standardImg}
          alt={`${room.type} Room`}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* Fallback if image fails */}
        <div style={{
          display: 'none',
          width: '100%',
          height: '100%',
          background: 'var(--bg-secondary)',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}>
          {room.type} Room
        </div>
        {/* Overlay: badge + room number */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)'
        }}>
          <span className={`badge ${getBadgeClass(room.type)}`}>
            {room.type} Room
          </span>
          <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: '600', letterSpacing: '0.05em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            ROOM {room.roomNumber}
          </span>
        </div>
      </div>

      {/* Price strip below image */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.35rem',
        background: '#FFFFFF'
      }}>
        <span style={{ fontSize: '1.65rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--accent-black)' }}>
          {formatCurrency(room.pricePerNight)}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>/ night</span>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            {room.type} Suite
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            {room.description || 'Thoughtfully designed luxury accommodation with premium bedding, tranquil ambiance, and dedicated guest service.'}
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={15} color="var(--text-muted)" />
              <span>Up to {room.capacity} Guests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bed size={15} color="var(--text-muted)" />
              <span>King Bed</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link 
            to={`/rooms/${room._id}`} 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
          >
            Details
          </Link>
          <button 
            onClick={() => onBook(room)} 
            className="btn btn-primary" 
            style={{ flex: 1.5, padding: '0.65rem', fontSize: '0.85rem' }}
          >
            <span>Book Stay</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
