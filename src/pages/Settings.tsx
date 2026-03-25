import React from 'react';
import { Card, CardContent, Button } from '../components/UI';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { motion } from 'motion/react';
import { Sun, Moon, Languages, Bell, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
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
          {t('settings')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{t('appearance')}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('appearance_desc')}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium dark:text-zinc-300">
                  {theme === 'light' ? t('light_mode') : t('dark_mode')}
                </span>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {t('toggle')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Languages size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{t('language')}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('language_desc')}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium dark:text-zinc-300">
                  {i18n.language === 'en' ? 'English' : 'العربية'}
                </span>
                <Button variant="outline" size="sm" onClick={toggleLanguage}>
                  {t('change')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{t('notifications')}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('notifications_desc')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 opacity-50">
                  <span className="text-sm font-medium dark:text-zinc-300">{t('email_notifications')}</span>
                  <div className="h-5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>
                <p className="text-[10px] text-zinc-400 italic px-2">{t('coming_soon')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{t('privacy_security')}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('privacy_desc')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm h-10 rounded-xl">
                  {t('change_password')}
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm h-10 rounded-xl">
                  {t('two_factor_auth')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
