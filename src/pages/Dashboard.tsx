import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Job, User, Candidate } from '../types';
import { Card, CardContent, Button, cn, Input } from '../components/UI';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Calendar, ArrowRight, Plus, Activity, Search, Bell, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

export default function Dashboard({ user }: { user: User }) {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch Jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    // Fetch Candidates across all jobs (using collectionGroup if possible, or fallback)
    // For now, let's try collectionGroup. If it fails due to index, we'll handle it.
    const candidatesQuery = query(
      collectionGroup(db, 'candidates'),
      where('jobId', 'in', jobs.length > 0 ? jobs.map(j => j.id) : ['__none__']),
      orderBy('createdAt', 'desc')
    );

    // Note: The above query might fail without an index. 
    // As a more robust alternative for this environment, we'll fetch per job if jobs change.
    
    return () => {
      unsubscribeJobs();
    };
  }, [user.uid]);

  // Fetch candidates whenever jobs change
  useEffect(() => {
    if (jobs.length === 0) {
      setCandidates([]);
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
          // Filter out existing candidates for this job and add new ones
          const otherCandidates = prev.filter(c => c.jobId !== job.id);
          const updated = [...otherCandidates, ...jobCandidates].sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          return updated;
        });
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [jobs]);

  // Prepare chart data (candidates per day for the last 7 days)
  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        date: d.toLocaleDateString(),
        candidates: 0
      };
    });

    candidates.forEach(c => {
      if (c.createdAt?.toDate) {
        const dateStr = c.createdAt.toDate().toLocaleDateString();
        const dayMatch = last7Days.find(d => d.date === dateStr);
        if (dayMatch) dayMatch.candidates++;
      }
    });

    return last7Days;
  }, [candidates]);

  const filteredJobs = jobs.filter(job => 
    job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotifications = () => {
    toast.info(t('recent_activity'));
  };

  const handleProfile = () => {
    toast.info(user.name);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text"
            placeholder="Search jobs, candidates..."
            className="w-full pl-12 pr-4 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-zinc-50"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full relative"
            onClick={handleNotifications}
          >
            <Bell size={20} className="text-zinc-500 dark:text-zinc-400" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
          </Button>
          <div 
            className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 cursor-pointer overflow-hidden"
            onClick={handleProfile}
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="h-full w-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
            ) : (
              user.name[0]
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex flex-col space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">
            {t('welcome_back')}
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t('welcome_user', { email: user.email })}
          </p>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg transition-colors">
          {t('manage_system')}
        </p>
      </motion.div>

      <Link to="/jobs/new">
        <Button className="flex items-center gap-2 rounded-full px-8 h-12 shadow-lg hover:shadow-xl transition-all bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold">
          <Plus size={20} /> {t('new_job')}
        </Button>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: t('active_jobs'),
            value: jobs.length.toString(),
            icon: <Briefcase size={24} />,
          },
          {
            title: t('total_candidates'),
            value: candidates.length.toString(),
            icon: <Users size={24} />,
          },
          {
            title: "Activity",
            value: (candidates.filter(c => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              return c.createdAt?.toDate?.() > d;
            }).length).toString(),
            icon: <Activity size={24} />,
          }
        ].map((item, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03 }}>
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-gray-500">{item.title}</p>
                  <h2 className="text-4xl font-bold">{item.value}</h2>
                </div>
                <div className="text-blue-500">{item.icon}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 p-8 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Candidates Activity</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Daily candidate submissions for the last 7 days</p>
              </div>
              <div className="flex items-center space-x-2 text-emerald-500 font-bold text-sm">
                <TrendingUp size={18} />
                <span>+12%</span>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="candidates" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCandidates)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Candidates Table */}
          <Card className="rounded-3xl shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 p-8 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Recent Candidates</h2>
              <Link to="/" className="text-sm font-bold text-blue-500 hover:underline">View all</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                    <th className="pb-4">Name</th>
                    <th className="pb-4">Position</th>
                    <th className="pb-4">Match</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 transition-colors">
                  {candidates.slice(0, 5).map((candidate) => (
                    <tr key={candidate.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-900 dark:text-zinc-50">
                            {candidate.name[0]}
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {jobs.find(j => j.id === candidate.jobId)?.jobTitle || 'Unknown'}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-xs font-bold",
                          candidate.matchScore >= 85 ? "text-emerald-500" :
                          candidate.matchScore >= 70 ? "text-amber-500" :
                          "text-zinc-400"
                        )}>
                          {candidate.matchScore}%
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          candidate.status === 'shortlisted' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                          candidate.status === 'reviewed' ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                          candidate.status === 'rejected' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400" :
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        )}>
                          {t(candidate.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-zinc-400 italic">No recent candidates found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Jobs List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 transition-colors">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Active Jobs</h2>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{jobs.length}</span>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/50" />
              ))
            ) : filteredJobs.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 italic">No jobs found.</div>
            ) : (
              filteredJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/jobs/${job.id}`}>
                    <Card className="hover:border-blue-500 dark:hover:border-blue-400 transition-all group rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm hover:shadow-md border border-zinc-200 dark:border-zinc-800">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-blue-500 transition-colors">
                                {job.jobTitle}
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{job.location || 'Remote'}</p>
                            </div>
                            <div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                              <ArrowRight size={16} className="rtl:rotate-180" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            <span>{job.createdAt?.toDate ? format(job.createdAt.toDate(), 'MMM d') : 'Recently'}</span>
                            <span className="flex items-center gap-1">
                              <Users size={10} />
                              {candidates.filter(c => c.jobId === job.id).length} Candidates
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
