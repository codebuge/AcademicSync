'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { User, Lock, AlertCircle, CheckCircle, Loader2, ChevronRight, GraduationCap } from 'lucide-react'

export default function SettingsPage() {
  const { user, setUser } = useAppStore()

  // Profile state
  const [fullName, setFullName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name)
  }, [user])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be empty.' })
      return
    }
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setProfileMsg({ type: 'error', text: 'Not authenticated.' })
        return
      }
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUser({ ...user!, ...updated })
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      } else {
        const err = await res.json().catch(() => ({}))
        setProfileMsg({ type: 'error', text: err.detail || 'Failed to update profile.' })
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter a new password.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMsg({ type: 'error', text: error.message })
      } else {
        setNewPassword('')
        setConfirmPassword('')
        setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Failed to update password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Manage your academic profile and account security
        </p>
      </div>

      {/* ── Personal Profile ── */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <User size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Personal Profile</h2>
          </div>
          <button
            id="save-profile-btn"
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 hover-lift"
            style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}
          >
            {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Save Changes
          </button>
        </div>

        {/* Avatar + form */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white select-none"
              style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))' }}>
              {initials}
            </div>
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Full Name
              </label>
              <input
                id="settings-full-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="w-full px-3 py-2.5 rounded-xl text-sm cursor-not-allowed"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', outline: 'none', opacity: 0.7 }}
              />
            </div>

            {/* Current Semester info */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
              <GraduationCap size={15} style={{ color: 'var(--primary)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Current Semester: <strong style={{ color: 'var(--foreground)' }}>
                  {user?.current_semester ?? 1}
                </strong>
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                style={{ background: 'rgba(45,212,191,0.12)', color: 'var(--primary)' }}>
                {user?.role ?? 'student'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile feedback */}
        {profileMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm animate-slide-down"
            style={{
              background: profileMsg.type === 'success' ? 'rgba(45,212,191,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${profileMsg.type === 'success' ? 'rgba(45,212,191,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: profileMsg.type === 'success' ? 'var(--primary)' : 'hsl(0,84%,70%)',
            }}>
            {profileMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {profileMsg.text}
          </div>
        )}
      </div>

      {/* ── Account Security ── */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Lock size={16} style={{ color: '#a78bfa' }} />
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Account Security</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
              New Password
            </label>
            <input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
              Confirm New Password
            </label>
            <input
              id="settings-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            id="update-password-btn"
            onClick={handleUpdatePassword}
            disabled={passwordSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 hover-lift"
            style={{ border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
          >
            {passwordSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Update Password
          </button>
        </div>

        {/* Password feedback */}
        {passwordMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm animate-slide-down"
            style={{
              background: passwordMsg.type === 'success' ? 'rgba(45,212,191,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(45,212,191,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: passwordMsg.type === 'success' ? 'var(--primary)' : 'hsl(0,84%,70%)',
            }}>
            {passwordMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {passwordMsg.text}
          </div>
        )}
      </div>

      {/* ── Quick Info ── */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Account Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Role', value: user?.role ?? '—' },
            { label: 'Current Semester', value: `Semester ${user?.current_semester ?? '—'}` },
            { label: 'Email', value: user?.email ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <p className="text-sm font-medium capitalize truncate" style={{ color: 'var(--foreground)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
