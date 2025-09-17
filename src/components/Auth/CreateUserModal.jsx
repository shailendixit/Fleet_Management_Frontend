import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Loading from '../UI/Loading'
import { signup as apiSignup } from '../../Api/authControllers'
import { useToast } from '../UI/ToastProvider'

export default function CreateUserModal({ open = false, onClose = () => {} }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    if (!open) return
    // prevent background scroll while modal is open
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return show('error', 'Passwords do not match')
    setLoading(true)
    try {
      // include role so backend creates an admin user
      const res = await apiSignup({ username: name, email, password, role: 'admin' })
      if (!res.success) {
        show('error', res.error || 'Create user failed')
        setLoading(false)
        return
      }
      show('success', 'User created')
      setName('')
      setEmail('')
      setPassword('')
      setConfirm('')
      setLoading(false)
      onClose()
    } catch (err) {
      show('error', err?.message || 'Unexpected error')
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 flex items-start md:items-center justify-center p-6"> 
      <div className="absolute inset-0 bg-black/5 z-40" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-gray-100 shadow-2xl max-h-[80vh] overflow-y-auto z-[99999] mt-24 md:mt-0">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Create new user</h3>
          <button onClick={() => !loading && onClose()} className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Full name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2 focus:ring-2 focus:ring-indigo-200" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2 focus:ring-2 focus:ring-indigo-200" placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Confirm password</label>
              <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2 focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t"> 
            <button type="button" className="px-4 py-2 rounded bg-white border" onClick={() => !loading && onClose()}>Cancel</button>
            <button type="submit" disabled={loading} className={`px-4 py-2 rounded bg-indigo-600 text-white ${loading ? 'opacity-70' : 'hover:bg-indigo-700'}`}>
              {loading ? <Loading size={18} /> : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
