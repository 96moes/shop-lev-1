import { apiClient } from './apiClient'
import type { AuthResult, User } from '../types/api'

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { data } = await apiClient.post<AuthResult>('/auth/register', input)
    return data
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const { data } = await apiClient.post<AuthResult>('/auth/login', {
      email,
      password,
    })
    return data
  },

  async profile(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/profile')
    return data
  },

  async updateProfile(input: {
    firstName?: string
    lastName?: string
    phone?: string
  }): Promise<User> {
    const { data } = await apiClient.patch<User>('/auth/profile', input)
    return data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },
}
