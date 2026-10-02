import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: '#FFFFFF',
      padding: '4.5rem 1.5rem 2.5rem',
      marginTop: '5rem'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '3rem',
        marginBottom: '3.5rem'
      }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{
              background: 'var(--accent-black)',
              color: '#FFFFFF',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Hotel size={18} />
            </div>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--accent-black)'
            }}>
              Manan Palace
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7', maxWidth: '300px' }}>
            A distinguished destination delivering refined luxury, thoughtful hospitality, and serene comfort.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            Navigation
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <Link to="/rooms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color var(--transition-fast)' }}>
                Room Catalog
              </Link>
            </li>
            <li>
              <Link to="/my-bookings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color var(--transition-fast)' }}>
                Guest Reservations
              </Link>
            </li>
            <li>
              <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color var(--transition-fast)' }}>
                Guest Portal Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Room Suites */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            Accommodations
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <li>Standard Suite</li>
            <li>Deluxe Executive Room</li>
            <li>Presidential Palace Suite</li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            Concierge & Location
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={15} color="var(--text-muted)" />
              <span>100 Royal Avenue, Heritage District</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} color="var(--text-muted)" />
              <span>+1 (800) 555-MANAN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={15} color="var(--text-muted)" />
              <span>concierge@mananpalace.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div>© {new Date().getFullYear()} Manan Palace. All rights reserved.</div>
        <div>Hotel Room Booking System (Problem 126)</div>
      </div>
    </footer>
  );
}
