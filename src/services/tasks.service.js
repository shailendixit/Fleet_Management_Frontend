import api from './apiClient';

/**
 * Fetch completed tasks from backend
 */
export async function getCompleted() {
  return await api.get('/tasks/getCompletedTasks', { timeout: 40000 });
}

/**
 * Fetch ongoing tasks from backend
 */
export async function getOngoing() {
  return await api.get('/tasks/getTasksInProgress', { timeout: 40000 });
}

/**
 * Fetch unassigned tasks. For development, if the API returns an error,
 * a small sample set is returned so you can test UI behaviour.
 */
export async function getUnassigned() {
  const res = await api.get('/tasks/getUnassignedTasks', { timeout: 40000 });
  if (res && res.success) return res;

  // fallback sample data for offline testing
  return {
    success: true,
    data: [
      { id: 'u1', zone: 'ww', invoice: '2001', order: '5001', postcode: '2170', description: 'Fragile', podUrl: '' },
      { id: 'u2', zone: 'North', invoice: '2002', order: '5002', postcode: '2171', description: 'Heavy', podUrl: '' },
      { id: 'u3', zone: 'South', invoice: '2003', order: '5003', postcode: '2167', description: 'Bulky', podUrl: '' },
         ],
  };
}

//----------Delete all task from backend---------
export async function DeleteAllTasks() {
  try {
    const res = await api.del('/tasks/deleteAllTasks', { timeout: 40000 });
    // return backend payload (assumes backend uses { success: true/false, ... })
    return res.data;
  } catch (err) {
    // normalize error to match other service functions
    if (err && err.response && err.response.data) {
      return err.response.data;
    }
    return { success: false, error: err.message || 'Network error' };
  }
}
/**
 * Fetch available drivers. Fallback sample used for dev/test.
 */
export async function getDrivers() {
  const res = await api.get('/tasks/getAvailableDrivers', { timeout: 40000 });
  if (res && res.success) return res;
  return { success: true, data: [ { id: 'd1', name: 'Adam' }, { id: 'd2', name: 'Mark' }, { id: 'd3', name: 'Lucy' } ] };
}

/**
 * Assign tasks (bulk). Expects payload: [{ taskId, driverId }, ...]
 * For dev we call API and return response; if API fails we return an error.
 */
export async function assignTasks(payload) {
  // backend expects body like: { tasks: [ { taskId, truckNo, cubic, driverName, truckType }, ... ] }
  return await api.post('/tasks/assignTasks', { tasks: payload }, { timeout: 30000 });
}

/**
 * Fetch Netstar vehicles directly from external Netstar API using credentials from env.
 * Returns: { success: true, data: VehiclesArray } or { success: false, error }
 */
export async function getNetstarVehicles() {
  return await api.get('/tasks/getLocation', { timeout: 40000 });
}

export default { getCompleted, getOngoing, getUnassigned, getDrivers, assignTasks, getNetstarVehicles,DeleteAllTasks };
