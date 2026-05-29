export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  client_name: string;
  description?: string;
  location?: string;
  start_date?: string;
  deadline_date?: string;
  status: ProjectStatus;
  cover_image_url?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  stages_count?: number;
  completed_stages_count?: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface Stage {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: StageStatus;
  expected_date?: string;
  completed_at?: string;
  responsible?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface ProjectFile {
  id: number;
  project_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  created_at: string;
}

export interface ProjectImage {
  id: number;
  project_id: number;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface Note {
  id: number;
  project_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
