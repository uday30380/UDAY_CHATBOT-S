
import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, Loader2, Lock, X } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onAdminLoginAttempt: (success: boolean, username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onAdminLoginAttempt }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Security / Rate Limiting State
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Google Simulation State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  useEffect(() => {
    // Check for existing lockout
    const storedLockout = localStorage.getItem('admin_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (Date.now() < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('admin_lockout');
      }
    }

    // Keyboard Shortcut to toggle Admin Mode (Alt + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        setIsAdminMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timer: number;
    if (lockoutUntil) {
      timer = window.setInterval(() => {
        if (Date.now() > lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
          localStorage.removeItem('admin_lockout');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleGoogleClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim() || !googleName.trim()) return;

    setIsLoading(true);

    // Simulate network authentication delay
    setTimeout(() => {
      onLogin({
        id: 'google-' + Math.random().toString(36).substr(2, 9),
        name: googleName,
        email: googleEmail,
        isAdmin: false,
        avatar: undefined, // Let the App generate initials
        status: 'Active',
        lastActive: Date.now()
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutUntil) return;

    // Basic Input Validation
    if (!username.trim() || !password.trim()) {
      setError('Credentials cannot be empty.');
      return;
    }

    if (username.length < 3) {
      setError('Username too short.');
      return;
    }

    setIsLoading(true);

    // Hardcoded credentials verification with delay to prevent timing attacks
    setTimeout(() => {
      if (username === 'uday' && password === 'nanna') {
        onAdminLoginAttempt(true, username);
        onLogin({
          id: 'admin-uday',
          name: 'Vempati Uday Kiran',
          email: 'admin@udaybot.com',
          isAdmin: true,
          status: 'Active',
          lastActive: Date.now()
        });
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        onAdminLoginAttempt(false, username);
        
        if (newAttempts >= 3) {
          const lockoutTime = Date.now() + 30 * 1000; // 30 seconds
          setLockoutUntil(lockoutTime);
          localStorage.setItem('admin_lockout', lockoutTime.toString());
          setError(`Too many failed attempts. Locked for 30s.`);
        } else {
          setError(`Invalid credentials. ${3 - newAttempts} attempts remaining.`);
        }
        setIsLoading(false);
      }
    }, 1000);
  };

  const getLockoutRemaining = () => {
    if (!lockoutUntil) return 0;
    return Math.ceil((lockoutUntil - Date.now()) / 1000);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">VEMPATI UDAY KIRAN'S BOT</h1>
          <p className="text-gray-400 text-sm mt-2">Secure Access Portal</p>
        </div>

        {isAdminMode ? (
          /* Admin Login Form */
          <form onSubmit={handleAdminLogin} className="space-y-4 animate-slide-up">
            {lockoutUntil ? (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-400 mb-4">
                <Lock size={20} />
                <div className="text-sm">
                  <p className="font-bold">Account Locked</p>
                  <p>Try again in {getLockoutRemaining()} seconds.</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter username"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            
            {error && !lockoutUntil && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            {!lockoutUntil && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Login as Admin'}
              </button>
            )}

            <button
              type="button"
              onClick={() => { setIsAdminMode(false); setError(''); }}
              className="w-full text-gray-400 text-sm hover:text-white transition-colors py-2"
            >
              Back to Standard Login
            </button>
          </form>
        ) : (
          /* Standard Options */
          <div className="space-y-4 animate-slide-up">
            <button
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            {/* Hidden admin trigger is now in the footer */}
          </div>
        )}
      </div>

      {/* Simulated Google Login Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white text-gray-900 rounded-lg w-full max-w-sm p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex justify-center mb-6">
               <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
            </div>
            
            <h3 className="text-xl font-medium text-center mb-1">Sign in with Google</h3>
            <p className="text-sm text-gray-500 text-center mb-6">to continue to Vempati Uday Kiran's Bot</p>
            
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                 <input 
                   type="email" 
                   required
                   value={googleEmail}
                   onChange={(e) => setGoogleEmail(e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   placeholder="yourname@gmail.com"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                 <input 
                   type="text" 
                   required
                   value={googleName}
                   onChange={(e) => setGoogleName(e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   placeholder="Your Name"
                 />
              </div>
              
              <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={isLoading}
                   className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                 >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Next"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-gray-600 flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Vempati Uday Kiran. All rights reserved.</p>
        {!isAdminMode && (
          <button 
            onClick={() => setIsAdminMode(true)} 
            className="text-gray-800 hover:text-indigo-500 transition-colors cursor-default p-2"
            title="Admin Login (Alt + A)"
          >
            <Lock size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
