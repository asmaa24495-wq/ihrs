import React, { useState } from 'react';
import { User } from '../types';
import { Card, CardContent, Button, Input } from '../components/UI';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Briefcase, Camera, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile({ user }: { user: User }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: name
      });

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name,
        companyName
      });

      toast.success(t('profile_updated'));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('profile')}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-3xl shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardContent className="p-8 -mt-16">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl font-bold text-zinc-400 overflow-hidden shadow-xl">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="h-full w-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
                  ) : (
                    (user.name || '?')[0]
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{user.name}</h2>
                <p className="text-zinc-500 dark:text-zinc-400">{user.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
                  {user.role}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="w-full space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label={t('name')} 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    icon={<UserIcon size={16} />}
                  />
                  <Input 
                    label={t('company_name')} 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)}
                    icon={<Briefcase size={16} />}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('email')}</label>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-sm">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Email cannot be changed directly.</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-xl h-12 font-bold shadow-lg hover:shadow-xl transition-all"
                  isLoading={loading}
                >
                  <Save size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('save_changes')}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
