import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, User, LogOut, Shield, Calendar, BedDouble } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        minHeight: '72px'
      }}>
        {/* Brand Logo / Wordmark */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--accent-black)',
            color: '#FFFFFF',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Hotel size={20} />
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.35rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              color: 'var(--accent-black)',
              textTransform: 'uppercase'
            }}>
              Manan Palace
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontWeight: '500'
            }}>
              Luxury Hotel & Suites
            </span>
          </div>
        </Link>

        {/* Navigation Links based on role */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link 
            to="/rooms" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              textDecoration: 'none',
              color: isActive('/rooms') ? 'var(--accent-black)' : 'var(--text-secondary)',
              fontWeight: isActive('/rooms') ? '700' : '500',
              fontSize: '0.925rem',
              transition: 'color var(--transition-fast)'
            }}
          >
            <BedDouble size={17} />
            <span>Explore Rooms</span>
          </Link>

          {/* Guest-only link */}
          {user && !isManager && (
            <Link 
              to="/my-bookings" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                textDecoration: 'none',
                color: isActive('/my-bookings') ? 'var(--accent-black)' : 'var(--text-secondary)',
                fontWeight: isActive('/my-bookings') ? '700' : '500',
                fontSize: '0.925rem',
                transition: 'color var(--transition-fast)'
              }}
            >
              <Calendar size={17} />
              <span>My Bookings</span>
            </Link>
          )}

          {/* Manager-only link */}
          {isManager && (
            <Link 
              to="/manager" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                textDecoration: 'none',
                color: isActive('/manager') ? '#FFFFFF' : 'var(--accent-black)',
                fontWeight: '600',
                fontSize: '0.85rem',
                background: isActive('/manager') ? 'var(--accent-black)' : 'var(--bg-subtle)',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Shield size={16} />
              <span>Manager Dashboard</span>
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600'
                }}>
                  {user.role}
                </div>
              </div>

              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
