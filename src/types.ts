export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  companyName?: string;
  role: 'admin' | 'recruiter';
}

export interface Job {
  id: string;
  jobTitle: string;
  description: string;
  skills?: string[];
  experience?: number;
  education?: string;
  location?: string;
  createdAt: any;
  userId: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experienceYears?: number;
  education?: string;
  matchScore: number;
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    summary: string;
    recommendation: string;
  };
  jobId: string;
  resumeText?: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'reviewed';
  createdAt: any;
}
