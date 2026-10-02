import React, { useState, useEffect } from 'react';
import { roomAPI, bookingAPI, formatCurrency } from '../services/api';
import { Shield, Plus, Bed, Calendar, Trash2, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManagerDashboard() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'bookings'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form for creating new room
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    type: 'Standard',
    pricePerNight: '',
    capacity: 2,
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        roomAPI.getRooms({ limit: 50 }),
        bookingAPI.getAllBookings({ limit: 50 }),
      ]);

      if (roomsRes.success) setRooms(roomsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch manager data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await roomAPI.createRoom({
        ...roomForm,
        pricePerNight: Number(roomForm.pricePerNight),
        capacity: Number(roomForm.capacity),
      });

      if (res.success) {
        setMessage(`Room ${res.data.roomNumber} created successfully!`);
        setShowCreateRoom(false);
        setRoomForm({ roomNumber: '', type: 'Standard', pricePerNight: '', capacity: 2, description: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    }
  };

  const handleDeactivateRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to deactivate Room ${roomNumber}? Active bookings must be cancelled first.`)) {
      return;
    }

    setMessage('');
    setError('');

    try {
      const res = await roomAPI.deleteRoom(roomId);
      if (res.success) {
        setMessage(`Room ${roomNumber} deactivated successfully.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to deactivate room.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Management Portal • Manan Palace
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Inventory & Guest Operations
          </h1>
        </div>

        {activeTab === 'rooms' && (
          <button 
            onClick={() => setShowCreateRoom(!showCreateRoom)} 
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Add New Room</span>
          </button>
        )}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('rooms')} 
          className="btn"
          style={{
            background: activeTab === 'rooms' ? 'var(--btn-primary-bg)' : 'transparent',
            color: activeTab === 'rooms' ? '#FFFFFF' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Bed size={17} />
          <span>Room Inventory ({rooms.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('bookings')} 
          className="btn"
          style={{
            background: activeTab === 'bookings' ? 'var(--btn-primary-bg)' : 'transparent',
            color: activeTab === 'bookings' ? '#FFFFFF' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Calendar size={17} />
          <span>Guest Reservations ({bookings.length})</span>
        </button>
      </div>

      {/* Create Room Form Modal */}
      {showCreateRoom && (
        <div className="card-panel" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Create New Inventory Suite
          </h3>
          <form onSubmit={handleCreateRoom}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Room Number
                </label>
                <input 
                  type="text" 
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. 402"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Category Type
                </label>
                <select 
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Price per Night (₹)
                </label>
                <input 
                  type="number" 
                  value={roomForm.pricePerNight}
                  onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}
                  placeholder="e.g. 2000"
                  className="input-field"
                  min="1"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Guest Capacity
                </label>
                <input 
                  type="number" 
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  className="input-field"
                  min="1"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea 
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                placeholder="High floor suite with sea views and private balcony..."
                className="input-field"
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setShowCreateRoom(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save & Publish Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          Loading portal inventory & reservations...
        </div>
      ) : activeTab === 'rooms' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rooms.map(room => (
            <div 
              key={room._id} 
              className="card-panel"
              style={{
                padding: '1.5rem 2rem',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr',
                gap: '1.5rem',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  Room {room.roomNumber}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {room.type} Room
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {formatCurrency(room.pricePerNight)} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>/ night</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacity</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {room.capacity} Guests
                </div>
              </div>

              <div>
                <span className={`badge ${room.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {room.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                {room.isActive && (
                  <button 
                    onClick={() => handleDeactivateRoom(room._id, room.roomNumber)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', color: 'var(--accent-rose)' }}
                    title="Deactivate Room"
                  >
                    <Trash2 size={15} />
                    <span>Deactivate</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(booking => (
            <div 
              key={booking._id} 
              className="card-panel"
              style={{
                padding: '1.5rem 2rem',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr 1fr',
                gap: '1.5rem',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  Room {booking.room?.roomNumber || 'N/A'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Ref: #{booking._id.slice(-8).toUpperCase()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {booking.guest?.name || 'Guest'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {booking.guest?.email || 'N/A'}
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              </div>

              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                  {formatCurrency(booking.totalPrice)}
                </div>
              </div>

              <div>
                <span className={`badge ${booking.status === 'confirmed' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

