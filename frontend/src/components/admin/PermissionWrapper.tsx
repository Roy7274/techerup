'use client'

import { useState, useEffect } from 'react'
import { getProfile } from '@/lib/api'

interface User {
  id: string
  username: string
  role: string
  cities: string[]
}

interface PermissionWrapperProps {
  children: React.ReactNode
  requiredRole?: string
  fallback?: React.ReactNode
}

export default function PermissionWrapper({ 
  children, 
  requiredRole, 
  fallback = null 
}: PermissionWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return <div>加载中...</div>
  }

  if (!user) {
    return <div>请先登录</div>
  }

  if (requiredRole && user.role !== requiredRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 权限检查Hook
export function usePermissions() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin' || isSuperAdmin
  const canManageAdmins = isSuperAdmin
  const canAccessAllCities = isSuperAdmin

  return {
    user,
    loading,
    isSuperAdmin,
    isAdmin,
    canManageAdmins,
    canAccessAllCities,
    manageableCities: user?.cities || []
  }
}
