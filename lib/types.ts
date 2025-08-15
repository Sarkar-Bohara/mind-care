// Frontend User interface (for UI components)
export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  role: 'patient' | 'psychiatrist' | 'counselor' | 'admin' | 'Patient' | 'Psychiatrist' | 'Counselor' | 'Admin';
  status?: 'Active' | 'Pending' | 'Suspended' | 'active' | 'pending' | 'suspended';
  phone?: string;
  joinDate?: string;
  lastLogin?: string;
  sessionsCount?: number;
  verified?: boolean;
}

// Frontend Post interface (for UI components)
export interface Post {
  id: number;
  author: string;
  title: string;
  content: string;
  timestamp: string;
  category: string;
  likes?: number;
  replies?: number;
  status: "pending" | "approved" | "rejected";
  flagged?: boolean;
  edited?: boolean;
  moderatedBy?: string;
  editedBy?: string;
}

// Database schema interfaces
export interface DbUser {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  role: 'patient' | 'psychiatrist' | 'counselor' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAppointment {
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: 'individual' | 'group' | 'family' | 'consultation';
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
}

export interface DbMoodEntry {
  entry_id: number;
  user_id: number;
  mood_score: number;
  anxiety_level?: number;
  stress_level?: number;
  sleep_hours?: number;
  notes?: string;
  entry_date: string;
  created_at: string;
}

export interface DbCommunityPost {
  post_id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by?: number;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}
