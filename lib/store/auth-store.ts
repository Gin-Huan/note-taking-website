'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean; // For initial auth check
  isAuthenticated: boolean;
  isInitialized: boolean; // New flag to track if initial auth check is complete
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true, // Start with loading true
  isAuthenticated: false,
  isInitialized: false, // Start with false

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        isInitialized: true 
      });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await apiClient.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false, 
        isInitialized: true 
      });
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        isInitialized: true 
      });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.login(email, password);
    
    // Store the token in localStorage
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token);
    }
    
    // Set the user data
    set({ 
      user: data.user, 
      isAuthenticated: true,
      isInitialized: true
    });
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API success
      localStorage.removeItem('auth_token');
      set({ 
        user: null, 
        isAuthenticated: false,
        isInitialized: true
      });
    }
  },

  register: async (name: string, email: string, password: string) => {
    const response = await apiClient.register(name, email, password);
    
    // Store the token in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    // Set the user data
    set({ 
      user: response.user, 
      isAuthenticated: true,
      isInitialized: true
    });
  },

  getCurrentUser: async () => {
    // This is now just an alias for initialize
    await get().initialize();
  },
}));