import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, formatCurrency } from '../services/api';
import { X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BookingModal({ room, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!room) return null;

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const nights = calculateNights();
  const totalPrice = nights * (room.pricePerNight || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (nights <= 0) {
      setError('Check-out date must be strictly after check-in date.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await bookingAPI.createBooking({
        roomId: room._id,
        checkIn,
        checkOut,
      });

      if (res.success) {
        setSuccessMsg(`Reservation confirmed at Manan Palace! Reference ID: ${res.data._id.slice(-8)}`);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.data);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        maxWidth: '480px',
        width: '100%',
        padding: '2.25rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>
            Manan Palace Reservation
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--accent-black)' }}>
            Reserve Room {room.roomNumber}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {room.type} Suite • {formatCurrency(room.pricePerNight)} / night
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--accent-rose-bg)',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--accent-emerald-bg)',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-emerald)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Check-in
              </label>
              <input 
                type="date"
                min={todayStr}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Check-out
              </label>
              <input 
                type="date"
                min={checkIn || todayStr}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>Stay Duration</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>Room Rate</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(room.pricePerNight)} / night</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.925rem' }}>Total Amount</span>
              <span style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--accent-black)' }}>
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1.5 }}
              disabled={loading || nights <= 0}
            >
              {loading ? 'Confirming...' : user ? 'Confirm Reservation' : 'Sign In & Reserve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
