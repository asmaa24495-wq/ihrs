import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from './types';
import { Button, Input, cn } from './components/UI';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { LayoutDashboard, Briefcase, LogOut, BrainCircuit, PlusCircle, Sun, Moon, Languages, Users, User as UserIcon, Mail, Settings } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Pages
import Dashboard from './pages/Dashboard';
import CreateJob from './pages/CreateJob';
import JobDetails from './pages/JobDetails';
import CandidateDetails from './pages/CandidateDetails';
import Profile from './pages/Profile';
import SettingsPage from './pages/Settings';
import Candidates from './pages/Candidates';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', i18n.language === 'ar' ? 'rtl' : 'ltr');
  }, [i18n.language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDoc;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            return;
          }

          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Create new user profile
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: 'recruiter',
            };
            try {
              await setDoc(userDocRef, newUser);
              setUser(newUser);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <BrainCircuit className="h-12 w-12 animate-pulse text-zinc-900 dark:text-zinc-50" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('app_name')}...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors app-bg">
      <Toaster position="top-center" richColors />
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 flex flex-col transition-colors">
        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-10">
          <BrainCircuit className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
          <span className="text-xl font-bold tracking-tight dark:text-zinc-50">{t('app_name')}</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/" icon={<LayoutDashboard size={18} />} label={t('dashboard')} />
          <NavLink to="/candidates" icon={<Users size={18} />} label={t('candidates')} />
          <NavLink to="/jobs/new" icon={<PlusCircle size={18} />} label={t('new_job')} />
          <NavLink to="/profile" icon={<UserIcon size={18} />} label={t('profile')} />
          <NavLink to="/settings" icon={<Settings size={18} />} label={t('settings')} />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          {/* Theme & Language Switchers */}
          <div className="flex items-center justify-between px-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <Languages size={18} />
            </Button>
          </div>

          <Link to="/profile" className="flex items-center space-x-3 rtl:space-x-reverse mb-4 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors">
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold dark:text-zinc-50 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} className="h-full w-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
              ) : (
                (user.name || '?')[0]
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate dark:text-zinc-50">{user.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.role}</p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            onClick={() => signOut(auth)}
          >
            <LogOut size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
            {t('sign_out')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/candidates" element={<Candidates user={user} />} />
          <Route path="/jobs/new" element={<CreateJob user={user} />} />
          <Route path="/jobs/:jobId/edit" element={<CreateJob user={user} />} />
          <Route path="/jobs/:jobId" element={<JobDetails user={user} />} />
          <Route path="/jobs/:jobId/candidates/:candidateId" element={<CandidateDetails user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive 
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900" 
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Login() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success(t('logged_in'));
      navigate('/');
    } catch (error: any) {
      console.error('Login failed', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error(t('popup_closed'));
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this one, it happens when another popup is opened
      } else {
        toast.error(t('invalid_email_password'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      const msg = t('password_too_short');
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success(t('account_created'));
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success(t('logged_in'));
      }
      navigate('/');
    } catch (err: any) {
      let errorMessage = isSignUp ? t('error_creating_account') : t('invalid_email_password');
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = t('email_already_in_use');
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors p-4 app-bg">
      <div className="w-full max-w-md space-y-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 mb-4">
            <BrainCircuit size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{t('app_name')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">AI-powered recruitment intelligence</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <Input 
            label={t('email')} 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            icon={<Mail size={16} />}
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
          />
          <Input 
            label={t('password')} 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            icon={<Briefcase size={16} />}
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button className="w-full h-12" type="submit" isLoading={loading}>
            {isSignUp ? t('sign_up') : t('sign_in')}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400">
              {t('or_continue_with')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-12 flex items-center justify-center gap-3 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-700" 
            onClick={handleGoogleLogin}
            isLoading={googleLoading}
          >
            {!googleLoading && <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />}
            {t('google_login')}
          </Button>
          
          <div className="text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              {isSignUp ? t('already_have_account') : t('dont_have_account')}
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}


export default App;
