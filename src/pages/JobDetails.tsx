import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Job, Candidate, User } from '../types';
import { Button, Card, cn } from '../components/UI';
import { useDropzone } from 'react-dropzone';
import { extractTextFromFile } from '../services/fileParser';
import { analyzeResume } from '../services/gemini';
import { ArrowLeft, Upload, Users, FileText, CheckCircle, AlertCircle, Loader2, Search, Briefcase, GraduationCap, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export default function JobDetails({ user }: { user: User }) {
  const { t } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'description'>('candidates');

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (jobDoc.exists()) {
          setJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `jobs/${jobId}`);
      }
    };

    fetchJob();

    const q = query(
      collection(db, 'jobs', jobId, 'candidates'),
      orderBy('matchScore', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const candidatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Candidate[];
      setCandidates(candidatesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `jobs/${jobId}/candidates`);
    });

    return () => unsubscribe();
  }, [jobId, navigate]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!job) return;
    
    setAnalyzing(true);
    setUploadProgress({ current: 0, total: acceptedFiles.length });

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress({ current: i + 1, total: acceptedFiles.length });

      try {
        const text = await extractTextFromFile(file);
        const analysis = await analyzeResume(text, job.description);
        
        const candidateData = {
          ...analysis,
          jobId: job.id,
          resumeText: text,
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        try {
          await addDoc(collection(db, 'jobs', job.id, 'candidates'), candidateData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `jobs/${job.id}/candidates`);
        }
      } catch (error) {
        console.error(`Error analyzing ${file.name}:`, error);
      }
    }

    setAnalyzing(false);
    setUploadProgress(null);
  }, [job]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  } as any);

  if (loading || !job) {
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
            onClick={() => navigate('/')} 
            className="rounded-full h-12 w-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 transition-colors">
              {job.jobTitle}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg transition-colors">
              {job.location || 'Remote'} • {job.experience} {t('years')} {t('experience')}
            </p>
          </div>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline" 
            className="rounded-full px-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm" 
            onClick={() => navigate(`/jobs/${jobId}/edit`)}
          >
            <Edit3 size={18} className="mr-2 rtl:ml-2 rtl:mr-0" /> {t('edit_job')}
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-8 rtl:space-x-reverse border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <button 
          onClick={() => setActiveTab('candidates')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
            activeTab === 'candidates' ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          {t('candidates')} ({candidates.length})
          {activeTab === 'candidates' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('description')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
            activeTab === 'description' ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          {t('job_description')}
          {activeTab === 'description' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'candidates' ? (
          <motion.div 
            key="candidates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-10"
          >
            {/* Upload Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-colors">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">{t('screen_candidates')}</h3>
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
                    isDragActive ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-95" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50",
                    analyzing && "pointer-events-none opacity-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center transition-colors">
                      <Upload className="text-zinc-400 dark:text-zinc-500" size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t('drop_resumes')}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{t('drop_resumes_desc')}</p>
                    </div>
                  </div>
                </div>
                
                {analyzing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-6 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span>{t('ai_analysis_progress')}</span>
                      <span>{uploadProgress?.current} / {uploadProgress?.total}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-500" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(uploadProgress?.current || 0) / (uploadProgress?.total || 1) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center italic">{t('gemini_working')}</p>
                  </motion.div>
                )}
              </Card>
            </div>

            {/* Candidates List */}
            <div className="lg:col-span-3 space-y-8">
              {candidates.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-6xl mb-6 opacity-20">👥</div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 transition-colors">{t('no_candidates')}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto transition-colors">{t('no_candidates_desc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {candidates.map((candidate, i) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link 
                        to={`/jobs/${jobId}/candidates/${candidate.id}`}
                        className="group block"
                      >
                        <Card className="p-8 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 transition-all bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm hover:shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <div className={cn(
                            "absolute top-0 left-0 w-2 h-full transition-colors",
                            candidate.matchScore >= 85 ? "bg-emerald-500" :
                            candidate.matchScore >= 70 ? "bg-amber-500" :
                            "bg-zinc-300 dark:bg-zinc-700"
                          )} />
                          
                          <div className="relative">
                            <div className="h-20 w-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              {candidate.name[0]}
                            </div>
                            <div className={cn(
                              "absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold shadow-lg transition-colors",
                              candidate.matchScore >= 85 ? "bg-emerald-500 text-white" :
                              candidate.matchScore >= 70 ? "bg-amber-500 text-white" :
                              "bg-zinc-400 text-white"
                            )}>
                              {candidate.matchScore}%
                            </div>
                          </div>

                          <div className="flex-1 space-y-2 text-center md:text-left rtl:md:text-right">
                            <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 transition-colors">{candidate.name}</h4>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest transition-colors">
                              <span className="flex items-center"><Briefcase size={14} className="mr-2 rtl:ml-2 rtl:mr-0" /> {candidate.experienceYears} {t('years')}</span>
                              <span className="flex items-center"><GraduationCap size={14} className="mr-2 rtl:ml-2 rtl:mr-0" /> {candidate.education?.split(',')[0]}</span>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 font-medium italic transition-colors">{candidate.summary}</p>
                          </div>

                          <div className="flex flex-col items-center md:items-end gap-3">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors",
                              candidate.status === 'shortlisted' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" :
                              candidate.status === 'reviewed' ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800" :
                              candidate.status === 'rejected' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800" :
                              "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"
                            )}>
                              {t(candidate.status)}
                            </span>
                            <div className="flex -space-x-2 rtl:space-x-reverse">
                              {candidate.skills?.slice(0, 3).map((skill, i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-600 dark:text-zinc-400 overflow-hidden transition-colors" title={skill}>
                                  {skill.substring(0, 2).toUpperCase()}
                                </div>
                              ))}
                              {(candidate.skills?.length || 0) > 3 && (
                                <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-50 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-white dark:text-zinc-900 transition-colors">
                                  +{(candidate.skills?.length || 0) - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="description"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-4xl space-y-8"
          >
            <Card className="p-10 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">{t('job_description')}</h3>
              <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed transition-colors">
                {job.description}
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">{t('requirements')}</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.map((skill, i) => (
                    <span key={i} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-full text-sm font-bold transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
              <Card className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">{t('summary')}</h3>
                <div className="space-y-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="text-zinc-400 dark:text-zinc-500">{t('experience')}</span>
                    <span>{job.experience} {t('years')}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="text-zinc-400 dark:text-zinc-500">{t('education')}</span>
                    <span>{job.education || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="text-zinc-400 dark:text-zinc-500">{t('location')}</span>
                    <span>{job.location || 'Remote'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


