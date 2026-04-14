import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Mail, KeyRound, User, ArrowRight } from 'lucide-react';
import { signUp, useSession } from '../lib/auth-client';
import { storage } from '../lib/storage';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const navigate = useNavigate();

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (!error) {
      const lastRoute = storage.get('last_opened_route') || '/';
      navigate(lastRoute);
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold font-headline mb-2 text-on-surface tracking-tight">Initialize</h2>
          <p className="text-on-surface-variant font-body text-sm">Create an account to persist your environment.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/50" size={16} />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-secondary outline-none" placeholder="Ada Lovelace" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/50" size={16} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-secondary outline-none" placeholder="dev@kinetic.app" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/50" size={16} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-secondary outline-none" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-secondary to-primary text-on-primary py-3 rounded-xl font-bold text-sm shadow-xl shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
            {loading ? 'Registering...' : 'CREATE ACCOUNT'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Already verified? <Link to="/signin" className="text-secondary hover:underline font-bold">Access Terminal</Link>
        </p>
      </div>
    </div>
  );
}
