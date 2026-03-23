import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Candidate, Job, User } from '../types';
import { Button, Card, cn } from '../components/UI';
import { ArrowLeft, CheckCircle, XCircle, Mail, Phone, GraduationCap, Briefcase, Star, AlertTriangle, FileText, Loader2, BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export default function CandidateDetails({ user }: { user: User }) {
  const { t } = useTranslation();
  const { jobId, candidateId } = useParams<{ jobId: string, candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || !candidateId) return;

    const fetchData = async () => {
      try {
        const candDoc = await getDoc(doc(db, 'jobs', jobId, 'candidates', candidateId));
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        
        if (candDoc.exists() && jobDoc.exists()) {
          setCandidate({ id: candDoc.id, ...candDoc.data() } as Candidate);
          setJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
        } else {
          navigate(`/jobs/${jobId}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `jobs/${jobId}/candidates/${candidateId}`);
      }
      setLoading(false);
    };

    fetchData();
  }, [jobId, candidateId, navigate]);

  const updateStatus = async (status: 'shortlisted' | 'rejected' | 'pending' | 'reviewed') => {
    if (!jobId || !candidateId || !candidate) return;
    try {
      await updateDoc(doc(db, 'jobs', jobId, 'candidates', candidateId), { status });
      setCandidate({ ...candidate, status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}/candidates/${candidateId}`);
    }
  };

  if (loading || !candidate || !job) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-zinc-900 dark:text-zinc-50" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center space-x-6 rtl:space-x-reverse">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/jobs/${jobId}`)} 
            className="rounded-full h-12 w-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 transition-colors">
              {candidate.name}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg transition-colors">
              Applying for <span className="text-blue-500 dark:text-blue-400">{job.jobTitle}</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline" 
            className={cn(
              "rounded-full px-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm transition-all",
              candidate.status === 'rejected' ? 'border-rose-500 text-rose-500 bg-rose-50/50 dark:bg-rose-900/20' : ''
            )}
            onClick={() => updateStatus('rejected')}
          >
            <XCircle size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
            {t('reject')}
          </Button>
          <Button 
            variant="outline"
            className={cn(
              "rounded-full px-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm transition-all",
              candidate.status === 'reviewed' ? 'border-green-500 text-green-600 bg-green-50/50 dark:bg-green-900/20' : ''
            )}
            onClick={() => updateStatus('reviewed')}
          >
            <CheckCircle size={18} className="mr-2 rtl:ml-2 rtl:mr-0 text-green-500" />
            {t('reviewed')}
          </Button>
          <Button 
            className={cn(
              "rounded-full px-8 transition-all",
              candidate.status === 'shortlisted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-zinc-900 dark:bg-zinc-50'
            )}
            onClick={() => updateStatus('shortlisted')}
          >
            <Star size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
            {t('shortlist')}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Profile Summary */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-8"
        >
          <Card className="p-10 text-center rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            <div className="relative inline-block mb-6">
              <div className="mx-auto h-32 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl font-bold text-zinc-900 dark:text-zinc-50 transition-colors">
                {candidate.name[0]}
              </div>
              <div className={cn(
                "absolute -bottom-2 -right-2 h-12 w-12 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center text-sm font-bold shadow-lg transition-colors",
                candidate.matchScore >= 85 ? "bg-emerald-500 text-white" :
                candidate.matchScore >= 70 ? "bg-amber-500 text-white" :
                "bg-zinc-400 text-white"
              )}>
                {candidate.matchScore}%
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 transition-colors">{t('candidate_details')}</h3>
            
            <div className="space-y-4 text-left rtl:text-right pt-8 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
              <ProfileItem icon={<Mail size={16} />} label={t('email')} value={candidate.email || 'N/A'} />
              <ProfileItem icon={<Phone size={16} />} label={t('phone')} value={candidate.phone || 'N/A'} />
              <ProfileItem icon={<Briefcase size={16} />} label={t('experience')} value={`${candidate.experienceYears} ${t('years')}`} />
              <ProfileItem icon={<GraduationCap size={16} />} label={t('education')} value={candidate.education || 'N/A'} />
            </div>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">{t('requirements')}</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills?.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg text-xs font-bold transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Right: AI Analysis */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          <Card className="p-10 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative transition-colors">
            <div className="absolute top-0 right-0 p-10 opacity-5 dark:text-white">
              <BrainCircuit size={120} />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center transition-colors">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 transition-colors">{t('ai_insights')}</h2>
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-widest transition-colors">{t('powered_by')}</p>
                </div>
              </div>

              <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('professional_summary')}</h4>
                <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed font-medium transition-colors">{candidate.summary}</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-6">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
                    <Star size={16} className="mr-2 rtl:ml-2 rtl:mr-0" /> {t('key_strengths')}
                  </h4>
                  <div className="space-y-3">
                    {candidate.analysis?.strengths.map((s, i) => (
                      <div key={i} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 text-sm text-emerald-900 dark:text-emerald-100 font-medium flex items-start transition-colors">
                        <CheckCircle size={16} className="mr-3 rtl:ml-3 rtl:mr-0 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {s}
                      </div>
                    ))}
                  </div>
                </section>
                <section className="space-y-6">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center">
                    <AlertTriangle size={16} className="mr-2 rtl:ml-2 rtl:mr-0" /> {t('potential_gaps')}
                  </h4>
                  <div className="space-y-3">
                    {candidate.analysis?.weaknesses.map((w, i) => (
                      <div key={i} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/50 text-sm text-amber-900 dark:text-amber-100 font-medium flex items-start transition-colors">
                        <AlertTriangle size={16} className="mr-3 rtl:ml-3 rtl:mr-0 mt-0.5 flex-shrink-0 text-amber-500" />
                        {w}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="p-8 bg-zinc-900 dark:bg-zinc-800 text-white rounded-3xl shadow-xl transition-colors">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{t('ai_recommendation')}</h4>
                <p className="text-xl font-bold leading-snug transition-colors">{candidate.analysis?.recommendation}</p>
              </section>
            </div>
          </Card>

          <Card className="p-10 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <FileText className="text-zinc-400 dark:text-zinc-500" size={24} />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 transition-colors">{t('extracted_text')}</h3>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full px-4" onClick={() => {
                const blob = new Blob([candidate.resumeText || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${candidate.name}_resume.txt`;
                a.click();
              }}>{t('download_text')}</Button>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 max-h-[500px] overflow-auto transition-colors">
              <pre className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {candidate.resumeText}
              </pre>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start space-x-4 rtl:space-x-reverse">
      <div className="mt-1 text-zinc-400 dark:text-zinc-500">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      </div>
    </div>
  );
}


