import { Note } from '@/lib/types/note';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuthResponse {
  access_token: string;
  user: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl ? `${this.baseUrl}/api/v1${endpoint}` : `/api/v1${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<ApiResponse<{ token: string; user: any }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getCurrentUser() {
    return this.request<ApiResponse<any>>('/users/profile');
  }

  async logout() {
    return this.request<ApiResponse<void>>('/auth/logout', {
      method: 'POST',
    });
  }

  // Notes endpoints
  async getNotes(page: number = 1, limit: number = 10): Promise<ApiResponse<NotesResponse>> {
    return this.request<ApiResponse<NotesResponse>>(`/notes?page=${page}&limit=${limit}`);
  }

  async getNote(id: string): Promise<ApiResponse<Note>> {
    return this.request<ApiResponse<Note>>(`/notes/${id}`);
  }

  async createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Note>> {
    return this.request<ApiResponse<Note>>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Note>> {
    return this.request<ApiResponse<Note>>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 