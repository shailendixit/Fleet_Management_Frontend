import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {login,signup, fetchProfile as apiFetchProfile} from '../../Api/authControllers.js'
import { useDispatch } from 'react-redux'
import { setAuth } from '../../store/reduxStore'
import Loading from '../UI/Loading'
import { useToast } from '../UI/ToastProvider'
import Logo from "../../assets/Company-Logo.png"; // adjust extension if needed
export default function AuthCard({ mode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { show: showToast } = useToast()
  const dispatch = useDispatch()

  const submit = async (e) => {
    e.preventDefault()
  // clear any previous global toast
  // (ToastProvider replaces toasts automatically)
    setLoading(true)
    if(!isLogin){
    if(password !== confirm){
      setLoading(false)
            showToast('error', 'Passwords do not match')
      return;
        }
        const res = await signup({ username: name, email, password });
        if(!res.success){
          showToast('error', res.error || 'Signup failed')
          setLoading(false)
          return;
        }
        // Try to auto-login the user right after signup for a smooth UX.
        try {
          const loginRes = await login({ username: name, password });
          if (loginRes && loginRes.success) {
            // token may be stored by the service or provided in response
            const token = loginRes.data?.token || localStorage.getItem('auth_token');
            // fetch profile
            const profile = await apiFetchProfile();
            if (profile.success) {
              dispatch(setAuth({ isAuthenticated: true, user: profile.data.user || profile.data, token, loading: false }));
              showToast('success', 'Signup successful. Signed in.')
              setLoading(false)
              navigate('/');
              return;
            } else {
              // profile fetch failed despite login; still navigate to login page to allow manual sign-in
              showToast('error', 'Signup succeeded but automatic profile fetch failed. Please sign in.')
              setLoading(false)
              navigate('/login');
              return;
            }
          } else {
            // auto-login failed - fall back to login page
            showToast('success', 'Account created. Please sign in.')
            setLoading(false)
            navigate('/login');
            return;
          }
        } catch (e) {
          // fallback path
          showToast('error', 'Auto-login failed after signup')
          setLoading(false)
          navigate('/login');
          return;
        }
    } else {
        const res = await login({ username: name, password });
        if(!res.success){
          showToast('error', res.error || 'Login failed')
          setLoading(false)
          return;
        }
        // token is stored by authControllers.login (fallback) OR backend cookie is used
  const token = res.data?.token || localStorage.getItem('auth_token')
        // try to fetch profile
        const profile = await apiFetchProfile()
        if (profile.success) {
          dispatch(setAuth({ isAuthenticated: true, user: profile.data.user || profile.data, token, loading: false }))
        } else {
          dispatch(setAuth({ isAuthenticated: !!token, user: null, token, loading: false }))
        }
  showToast('success', 'Signed in successfully')
        setLoading(false)
        navigate('/')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      {/* dim + blur background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* left: decorative */}
          <div className="hidden md:flex flex-col items-center justify-center p-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg text-center">
  <img 
    src={Logo} 
    alt="logo" 
    className="w-35 h-24 mb-6 rounded-3xl object-cover" 
  />
  <h2 className="text-3xl font-semibold mb-2">Welcome to Driver Assignment</h2>
  <p className="text-indigo-100/90 max-w-md">
    Manage tasks, track drivers, and stay on top of deliveries with a clean, fast interface.
  </p>
</div>

          {/* right: form */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold">{isLogin ? 'Sign in to your account' : 'Create an account'}</h3>
                <p className="text-sm text-gray-600">{isLogin ? 'Enter your credentials to continue.' : 'Start managing assignments quickly.'}</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
               
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 p-2" placeholder="Your name" />
                </div>
              
           {(!isLogin &&
                 <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 p-2" placeholder="you@example.com" />
              </div>
           )}
             

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 p-2" placeholder="••••••••" />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                  <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 p-2" placeholder="Repeat password" />
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a className="text-sm text-indigo-600 hover:underline" href="#">Forgot?</a>
              </div>

              <div>
                <button disabled={loading} type="submit" className={`w-full inline-flex items-center justify-center gap-2 rounded-lg ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 font-medium shadow`}>
                  {loading && <Loading size={18} />}
                  <span>{isLogin ? (loading ? 'Signing in...' : 'Sign in') : (loading ? 'Creating...' : 'Create account')}</span>
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600">
              {isLogin ? (
                <>If you don't have an account contact your administrator.</>
              ) : (
                <>Account creation via this page is disabled. Administrators can create users from the dashboard.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
