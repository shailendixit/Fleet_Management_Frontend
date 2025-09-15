import { useDispatch } from 'react-redux'
import { setAuth, clearAuth } from './reduxStore'

export const useAuth = () => {
    const dispatch = useDispatch()

    const login = (userData) => {
        dispatch(setAuth({ isAuthenticated: true, user: userData, loading: false }))
    }

    const logout = () => {
        dispatch(clearAuth())
    }

    return { login, logout }
}