// Re-export the new service implementation located in ../services/auth.service.js
// This file kept for backward compatibility with existing imports in the app.
import authService from "../services/auth.service";

export const signup = authService.signup;
export const login = authService.login;
export const getToken = authService.getToken;
export const logout = authService.logout;
export const fetchProfile = authService.fetchProfile;

export default authService;