import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/reduxStore';
import authService from '../services/auth.service';
import { useToast } from '../components/UI/ToastProvider';

/**
 * Hook that initializes authentication on app startup.
 * - Sets loading state while verification happens
 * - Reads token from cookie/localStorage
 * - Calls backend to verify token and updates Redux auth slice
 * - Cleans up when unmounted
 */
export default function useInitAuth() {
  const dispatch = useDispatch();
  let toast
  try { toast = useToast() } catch (e) { toast = null }
  useEffect(() => {
    let mounted = true;

    async function init() {
      // start loading
      if (!mounted) return;
      dispatch(setAuth({ loading: true }));
      // show a global loading toast when initializing auth
      const loadingToastShown = (() => {
        try { if (toast) { toast.show('success', 'Verifying session...'); return true } } catch (e) {}
        return false
      })();

      const token = authService.getToken();
      if (!token) {
        // No token -> user not authenticated
        if (!mounted) return;
        dispatch(setAuth({ isAuthenticated: false, user: null, token: null, loading: false }));
        if (loadingToastShown && toast) toast.hide()
        return;
      }

      // verify token with server
      const res = await authService.fetchProfile();
      if (!mounted) return;
      if (res && res.success) {
        dispatch(setAuth({ isAuthenticated: true, user: res.data?.user || res.data || null, token, loading: false }));
        if (toast) toast.show('success', 'Session verified')
      } else {
        // invalid token: clear client state
        try { await authService.logout(); } catch (e) {}
        dispatch(setAuth({ isAuthenticated: false, user: null, token: null, loading: false }));
        if (toast) toast.show('error', 'Session invalid. Please sign in.')
      }
      if (toast) toast.hide()
    }

    init();

    return () => { mounted = false; };
  }, [dispatch]);
}
