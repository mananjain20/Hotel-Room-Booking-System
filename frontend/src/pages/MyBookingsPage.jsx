import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, formatCurrency } from '../services/api';
import { Calendar, Bed, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      setError('Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? This will release your reserved dates.')) {
      return;
    }

    setCancellingId(id);
    setMessage('');
    setError('');

    try {
      const res = await bookingAPI.cancelBooking(id);
      if (res.success) {
        setMessage('Reservation cancelled successfully. Your room dates have been released.');
        fetchMyBookings();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Guest Portal • Manan Palace
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          My Reservations & Stays
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          View your confirmed itineraries, stay details, and reservation statuses.
        </p>
      </div>

      {message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 1.25rem',
          background: 'rgba(40, 167, 69, 0.08)',
          border: '1px solid rgba(40, 167, 69, 0.25)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-emerald)',
          fontSize: '0.9rem',
          marginBottom: '2rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 1.25rem',
          background: 'rgba(217, 83, 79, 0.08)',
          border: '1px solid rgba(217, 83, 79, 0.25)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-rose)',
          fontSize: '0.9rem',
          marginBottom: '2rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          Loading your reservations...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Calendar size={44} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '600', marginBottom: '0.5rem' }}>
            No Active Reservations
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
            You have not reserved any suites yet. Explore the exquisite accommodations at Manan Palace.
          </p>
          <Link to="/rooms" className="btn btn-primary">
            Explore Suites & Rooms
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map(booking => {
            const isConfirmed = booking.status === 'confirmed';
            return (
              <div 
                key={booking._id} 
                className="card-panel"
                style={{
                  padding: '1.75rem',
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1.2fr 1.2fr',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {booking.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Ref: #{booking._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                    Room {booking.room?.roomNumber || 'N/A'} — {booking.room?.type || 'Suite'}
                  </h3>
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <Calendar size={15} color="var(--text-primary)" />
                    <span><strong>Check-in:</strong> {formatDate(booking.checkIn)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} color="var(--text-primary)" />
                    <span><strong>Check-out:</strong> {formatDate(booking.checkOut)}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Billed
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                    {formatCurrency(booking.totalPrice)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {isConfirmed ? (
                    <button 
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingId === booking._id}
                      className="btn btn-secondary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.825rem', color: 'var(--accent-rose)' }}
                    >
                      {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Stay'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

