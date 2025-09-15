import { configureStore, createSlice } from '@reduxjs/toolkit'
import tasksReducer from './tasksSlice'

const initialState = {
  // Start in a conservative state: not authenticated and loading true
  // so the app verifies the session before allowing access to protected routes.
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      return { ...state, ...action.payload }
    },
    clearAuth(state) {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.loading = false
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
  },
})

export const { setAuth, clearAuth, setLoading } = authSlice.actions

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  tasks: tasksReducer,
  },
})

export default store
