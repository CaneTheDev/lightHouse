import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    if (isSignUp) {
      signup(email.trim());
    } else {
      login(email.trim());
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Visual Ambient Blur Backgrounds */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(160,80,220,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(230,100,180,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      <div className="fade-in-up" style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* Logo and Brand Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '56px', 
            height: '56px', 
            borderRadius: '16px',
            background: 'var(--bg-btn-dark)',
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: 800,
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}>
            ≠
          </div>
          <h1 className="hero-heading" style={{ fontSize: '36px', letterSpacing: '-1.5px', marginBottom: '8px' }}>
            Opportunity<span className="faded">OS</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Intelligent Multi-Agent Opportunity Discovery Platform
          </p>
        </div>

        {/* Card Form */}
        <div className="card" style={{ 
          padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
        }}>
          
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {isSignUp ? 'Sign up to build your profile and find matches.' : 'Sign in with any credentials to continue.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Email field */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px'
              }}>
                <Mail size={12} /> Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-clean"
                style={{ fontSize: '13.5px', padding: '12px 14px' }}
              />
            </div>

            {/* Password field */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px'
              }}>
                <Lock size={12} /> Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-clean"
                style={{ fontSize: '13.5px', padding: '12px 14px' }}
              />
            </div>

            {/* Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="btn-primary"
              style={{ 
                justifyContent: 'center', 
                padding: '13px', 
                borderRadius: '12px',
                marginTop: '6px',
                fontSize: '13.5px'
              }}
            >
              {isSignUp ? (
                <>Sign Up <UserPlus size={15} /></>
              ) : (
                <>Sign In <LogIn size={15} /></>
              )}
            </button>

          </form>

          <div className="divider" style={{ margin: '24px 0' }} />

          {/* Toggle mode */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                id="auth-toggle-btn"
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
export default Login;
