// ...existing code...
import React from 'react'
import { useAuth } from '../../store/useAuth';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../../Api/authControllers'; // <-- add
import { useToast } from '../UI/ToastProvider'

export default function LogoutBtn({ className = 'text-sm text-gray-600 hover:underline', children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { show: showToast } = useToast()

  const handleLogout = async () => {
    try {
      await apiLogout(); // call backend to clear cookie
  showToast('success', 'Logged out')
    } catch (err) {
  showToast('error', 'Logout failed')
    }
    try { logout(); } catch (e) { /* ignore */ }
    navigate('/login');
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children ?? 'Logout'}
    </button>
  )
}
// ...existing code... 