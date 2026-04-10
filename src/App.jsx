import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ChatInterface from './components/ChatInterface';

const supabase = createClient(
  'https://yfaccxjykhhyuftwnzrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmYWNjeGp5a2hoeXVmdHduenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzAzNjAsImV4cCI6MjA5MTE0NjM2MH0.Bc1EGtPp-uchD852G85r-4w-CQftPLrCDM_vNEoVjmU'
);

export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0f1a', color: '#fff' }}>
        <div style={{ fontSize: '48px' }}>🌅</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 100%)' }}>
        <div style={{ background: '#0d1321', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌅</div>
            <h1 style={{ color: '#fff', margin: '0 0 8px', fontSize: '28px' }}>Sunset ARC</h1>
            <p style={{ color: '#64748b', margin: 0 }}>AI-powered automation platform</p>
          </div>
          <form onSubmit={handleAuth}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '14px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', marginBottom: '12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '14px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>{isSignUp ? 'Create Account' : 'Sign In'}</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', marginLeft: '4px' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
        </div>
      </div>
    );
  }

  return <ChatInterface user={user} session={session} onLogout={handleLogout} />;
}