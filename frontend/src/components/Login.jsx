import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      if (isSignUp) {
        // Handle Sign Up
        const users = JSON.parse(localStorage.getItem('crowdshield_users') || '{}');
        if (users[username]) {
          setError('Username already exists. Please sign in instead.');
          setIsSubmitting(false);
          return;
        }
        users[username] = password;
        localStorage.setItem('crowdshield_users', JSON.stringify(users));
        // Automatically log them in after sign up
        onLogin();
      } else {
        // Handle Login
        const users = JSON.parse(localStorage.getItem('crowdshield_users') || '{}');
        if ((username === 'admin' && password === 'admin123') || users[username] === password) {
          onLogin();
        } else {
          setError('Invalid credentials.');
          setIsSubmitting(false);
        }
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        zIndex: 0,
        filter: 'blur(40px)'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
        zIndex: 0,
        filter: 'blur(50px)'
      }}></div>

      <div className="glass animate-slide-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        zIndex: 1,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(56, 189, 248, 0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
          }}>
            <Shield size={32} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '8px', textAlign: 'center' }}>
            CrowdShield <span style={{ color: '#a78bfa' }}>AI</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center' }}>
            Secure Access • Crush Risk Engine
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 42px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 42px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          {error && (
            <div className="animate-fade-in" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '16px',
              background: isSignUp ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isSubmitting ? 'default' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              boxShadow: isSignUp ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(139, 92, 246, 0.3)',
              opacity: isSubmitting ? 0.8 : 1
            }}
            onMouseOver={(e) => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isSubmitting ? (
              <>
                <Activity size={20} className="animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Authenticating...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account & Access' : 'Access Control Room'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setUsername(''); setPassword(''); }}
            style={{
              background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: '4px'
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          Restricted access. Authorized personnel only.
        </div>

      </div>
    </div>
  );
}
