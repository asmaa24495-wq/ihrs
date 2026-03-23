import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Job, User, Candidate } from '../types';
import { Card, CardContent, Button, cn, Input } from '../components/UI';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ArrowRight, Briefcase, GraduationCap, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export default function Candidates({ user }: { user: User }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Fetch Jobs to know which candidates belong to this user
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', user.uid)
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setJobs(jobsData);
    });

    return () => unsubscribeJobs();
  }, [user.uid]);

  useEffect(() => {
    if (jobs.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    jobs.forEach(job => {
      const q = query(
        collection(db, 'jobs', job.id, 'candidates'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const jobCandidates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Candidate[];
        
        setCandidates(prev => {
          const otherCandidates = prev.filter(c => c.jobId !== job.id);
          const updated = [...otherCandidates, ...jobCandidates].sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          return updated;
        });
        setLoading(false);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [jobs]);

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">
            Candidates
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg transition-colors">
            Manage and screen all applicants across your job postings
          </p>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search candidates..."
              className="pl-12 pr-4 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-zinc-50 w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-zinc-50 text-sm font-bold"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </motion.div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-zinc-100/50 dark:bg-zinc-800/50" />
          ))
        ) : filteredCandidates.length === 0 ? (
          <Card className="p-20 text-center rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 transition-colors">
            <div className="text-6xl mb-6 opacity-20">👥</div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 transition-colors">No candidates found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto transition-colors">Try adjusting your search or filters to find what you're looking for.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCandidates.map((candidate, i) => (
                <motion.div
                  key={candidate.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/jobs/${candidate.jobId}/candidates/${candidate.id}`}>
                    <Card className="group hover:border-blue-500 dark:hover:border-blue-400 transition-all rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm hover:shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:bg-blue-500 group-hover:text-white transition-all">
                              {candidate.name[0]}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight transition-colors">{candidate.name}</h3>
                              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">
                                {jobs.find(j => j.id === candidate.jobId)?.jobTitle || 'Position'}
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "h-12 w-12 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold shadow-lg transition-colors",
                            candidate.matchScore >= 85 ? "bg-emerald-500 text-white" :
                            candidate.matchScore >= 70 ? "bg-amber-500 text-white" :
                            "bg-zinc-400 text-white"
                          )}>
                            {candidate.matchScore}%
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills?.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-bold transition-colors">
                                {skill}
                              </span>
                            ))}
                            {(candidate.skills?.length || 0) > 3 && (
                              <span className="px-3 py-1 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-full text-[10px] font-bold transition-colors">
                                +{(candidate.skills?.length || 0) - 3}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 transition-colors",
                              candidate.status === 'shortlisted' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" :
                              candidate.status === 'reviewed' ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800" :
                              candidate.status === 'rejected' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800" :
                              "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"
                            )}>
                              {t(candidate.status)}
                            </span>
                            <div className="flex items-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                              <span className="text-xs font-bold mr-2 rtl:ml-2 rtl:mr-0">View Profile</span>
                              <ChevronRight size={16} className="rtl:rotate-180" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
