import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Job } from '../types';
import { Button, Input, Card } from '../components/UI';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export default function CreateJob({ user }: { user: User }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const isEditing = !!jobId;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    experience: '',
    education: '',
    location: '',
  });

  useEffect(() => {
    if (isEditing && jobId) {
      const fetchJob = async () => {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          if (jobDoc.exists()) {
            const data = jobDoc.data() as Job;
            setFormData({
              title: data.jobTitle,
              description: data.description,
              skills: data.skills?.join(', ') || '',
              experience: data.experience?.toString() || '',
              education: data.education || '',
              location: data.location || '',
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `jobs/${jobId}`);
        } finally {
          setFetching(false);
        }
      };
      fetchJob();
    }
  }, [jobId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setLoading(true);
    try {
      const jobData = {
        jobTitle: formData.title,
        description: formData.description,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: formData.experience ? parseInt(formData.experience) : 0,
        education: formData.education,
        location: formData.location,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && jobId) {
        await updateDoc(doc(db, 'jobs', jobId), jobData);
        navigate(`/jobs/${jobId}`);
      } else {
        const newJobData = {
          ...jobData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'jobs'), newJobData);
        navigate(`/jobs/${docRef.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, isEditing ? `jobs/${jobId}` : 'jobs');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-zinc-900 dark:text-zinc-50" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-10 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 rtl:space-x-reverse">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-full h-12 w-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 transition-colors">
              {isEditing ? t('edit_job') : t('new_job')}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {isEditing ? t('update_job_details') : t('create_new_opportunity')}
            </p>
          </div>
        </div>
        <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 transition-colors">
          <Sparkles size={24} />
        </div>
      </div>

      <Card className="p-10 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-8">
            <Input 
              label={t('job_title')} 
              placeholder="e.g. Senior Software Engineer" 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="h-14 text-lg font-medium dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-50"
            />

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest transition-colors">{t('description')}</label>
              <textarea 
                className="flex min-h-[300px] w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 px-4 py-4 text-base ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-50 transition-colors leading-relaxed"
                placeholder="Paste the full job description here..."
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input 
                label="Required Skills (comma separated)" 
                placeholder="React, TypeScript, Node.js" 
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                className="h-12 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-50"
              />
              <Input 
                label="Years of Experience" 
                type="number" 
                placeholder="e.g. 5" 
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                className="h-12 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-50"
              />
              <Input 
                label="Education Level" 
                placeholder="e.g. Bachelor's in CS" 
                value={formData.education}
                onChange={e => setFormData({ ...formData, education: e.target.value })}
                className="h-12 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-50"
              />
              <Input 
                label={t('location')} 
                placeholder="e.g. Remote / New York" 
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="h-12 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-4 rtl:space-x-reverse transition-colors">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => navigate(-1)} 
              className="rounded-full px-8 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              isLoading={loading} 
              className="rounded-full px-10 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all font-bold"
            >
              <Save size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
              {isEditing ? t('update_job') : t('save')}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
