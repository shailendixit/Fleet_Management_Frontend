import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tasksService from '../services/tasks.service';

export const fetchCompleted = createAsyncThunk('tasks/fetchCompleted', async (_, thunkAPI) => {
  const res = await tasksService.getCompleted();
  if (!res || !res.success) {
    const err = (res && res.error) || (res && res.data) || 'Failed to fetch completed tasks';
    return thunkAPI.rejectWithValue(String(err));
  }
  return res.data;
});

export const fetchOngoing = createAsyncThunk('tasks/fetchOngoing', async (_, thunkAPI) => {
  const res = await tasksService.getOngoing();
  if (!res || !res.success) {
    const err = (res && res.error) || (res && res.data) || 'Failed to fetch ongoing tasks';
    return thunkAPI.rejectWithValue(String(err));
  }
  return res.data;
});

const initialState = {
  completed: { items: [], loading: false, error: null },
  ongoing: { items: [], loading: false, error: null },
};

const slice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompleted.pending, (s) => { s.completed.loading = true; s.completed.error = null; })
      .addCase(fetchCompleted.fulfilled, (s, a) => { s.completed.loading = false; s.completed.items = a.payload || []; })
      .addCase(fetchCompleted.rejected, (s, a) => { s.completed.loading = false; s.completed.error = a.payload || a.error?.message; })

      .addCase(fetchOngoing.pending, (s) => { s.ongoing.loading = true; s.ongoing.error = null; })
      .addCase(fetchOngoing.fulfilled, (s, a) => { s.ongoing.loading = false; s.ongoing.items = a.payload || []; })
      .addCase(fetchOngoing.rejected, (s, a) => { s.ongoing.loading = false; s.ongoing.error = a.payload || a.error?.message; });
  },
});

export default slice.reducer;

export const selectCompleted = (state) => state.tasks.completed;
export const selectOngoing = (state) => state.tasks.ongoing;
