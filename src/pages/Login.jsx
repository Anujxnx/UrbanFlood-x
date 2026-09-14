import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn({ email, password });
      const userRole = res?.user?.user_metadata?.role || res?.role || (email.toLowerCase().includes('officer') || email.toLowerCase().includes('gov') || email.toLowerCase().includes('municipal') ? 'MUNICIPAL_AUTHORITY' : 'CITIZEN');
      if (userRole === 'MUNICIPAL_AUTHORITY') {
        navigate('/municipal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (accountType) => {
    if (accountType === 'municipal') {
      setEmail('officer@dibrugarh.gov.in');
      setPassword('Admin@1234');
    } else {
      setEmail('citizen@dibrugarh.in');
      setPassword('Citizen@1234');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side - Branding */}
        <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-sky-600 rounded-xl">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white">UrbanFlood AI</span>
            </Link>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">
              Hyper-local flood intelligence for smarter urban response.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Real-time waterlogging risk forecasting, drainage network monitoring, and emergency prioritization for Dibrugarh, Assam.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Dibrugarh Municipal Command & Control</span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Welcome Back</h3>
            <p className="text-xs text-slate-400 mt-1">Sign in to access the flood prediction dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@dibrugarh.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-2 border-t border-slate-800">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
                Or Quick Fill Demo Profile:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('citizen')}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>👤 Citizen User</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('municipal')}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>🏛️ Municipal Officer</span>
                </button>
              </div>
            </div>

          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-sky-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
