import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomAPI } from '../services/api';
import RoomCard from '../components/RoomCard';
import BookingModal from '../components/BookingModal';
import { ShieldCheck, Clock, Award, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await roomAPI.getRooms({ limit: 3, sort: '-pricePerNight' });
        if (res.success && res.data) {
          setFeaturedRooms(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured rooms:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div>
      {/* Welcome Hero Section */}
      <section style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        padding: '5rem 1.5rem 6rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem'
          }}>
            Luxury Accommodations & Hospitality
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
            fontWeight: '700',
            color: 'var(--accent-black)',
            lineHeight: '1.2',
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em'
          }}>
            Welcome to Manan Palace
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            lineHeight: '1.8',
            marginBottom: '2.5rem',
            maxWidth: '620px',
            margin: '0 auto 2.5rem'
          }}>
            A heritage of understated luxury, bespoke guest services, and meticulously appointed suites tailored for an exceptional stay.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/rooms" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
              <span>Explore Rooms</span>
              <ArrowRight size={16} />
            </Link>
            <a href="#featured" className="btn btn-secondary" style={{ padding: '0.85rem 2rem' }}>
              Featured Suites
            </a>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="container" style={{ padding: '4.5rem 1.5rem 3rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div className="card-panel" style={{ padding: '2rem', background: '#FFFFFF' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              width: 'fit-content',
              marginBottom: '1.25rem',
              color: 'var(--accent-black)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-black)' }}>
              Guaranteed Reservations
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Real-time room availability validation ensures seamless booking confirmation with zero reservation conflicts.
            </p>
          </div>

          <div className="card-panel" style={{ padding: '2rem', background: '#FFFFFF' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              width: 'fit-content',
              marginBottom: '1.25rem',
              color: 'var(--accent-black)'
            }}>
              <Clock size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-black)' }}>
              Flexible Booking Management
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              View and manage active reservations at your convenience with instant cancellation and date restoration.
            </p>
          </div>

          <div className="card-panel" style={{ padding: '2rem', background: '#FFFFFF' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              width: 'fit-content',
              marginBottom: '1.25rem',
              color: 'var(--accent-black)'
            }}>
              <Award size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-black)' }}>
              Premium Living Spaces
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Each Standard, Deluxe, and Palace Suite features refined furnishings, curated bedding, and tranquil surroundings.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Suites Section */}
      <section id="featured" className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Selected Accommodations
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--accent-black)' }}>
              Featured Suites
            </h2>
          </div>
          <Link to="/rooms" style={{ color: 'var(--accent-black)', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>View All Rooms</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading accommodations...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {featuredRooms.map(room => (
              <RoomCard 
                key={room._id} 
                room={room} 
                onBook={(r) => setSelectedRoom(r)} 
              />
            ))}
          </div>
        )}
      </section>

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
