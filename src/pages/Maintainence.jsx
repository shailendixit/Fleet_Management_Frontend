import React, { useEffect, useState, useMemo } from 'react';
import AnimatedContainer from '../components/UI/AnimatedContainer';
import Loading from '../components/UI/Loading';
import { useToast } from '../components/UI/ToastProvider';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

function EditableCell({ value, onChange, type = 'text', className = '' }) {
	return (
		<input
			className={`w-full px-2 py-1 border rounded text-sm ${className}`}
			value={value ?? ''}
			onChange={(e) =>
				onChange(
					type === 'number'
						? e.target.value === ''
							? ''
							: Number(e.target.value)
						: e.target.value
				)
			}
			type={type === 'number' ? 'number' : 'text'}
		/>
	);
}

export default function Maintainence() {
	const { show } = useToast();
	const [drivers, setDrivers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [edits, setEdits] = useState({});
	const [query, setQuery] = useState('');

	const fetchDrivers = async () => {
	setLoading(true);
	try {
		const res = await fetch(`${API_BASE}/maintenance/drivers`);
		const data = await res.json();

		// ✅ Handle all possible response shapes
		let list = [];
		if (Array.isArray(data)) {
			list = data;
		} else if (Array.isArray(data?.data)) {
			list = data.data;
		} else if (Array.isArray(data?.drivers)) {
			// <-- ✅ Your API format
			list = data.drivers;
		}

		setDrivers(list);
		setEdits({});
	} catch (e) {
		console.error(e);
		show('error', 'Failed to load drivers');
	} finally {
		setLoading(false);
	}
};


	useEffect(() => {
		fetchDrivers();
	}, []);

	const handleEdit = (driverId, field, value) => {
		setEdits((s) => {
			const existing = s[driverId] || {};
			const updated = { ...existing, [field]: value };
			return { ...s, [driverId]: updated };
		});
	};

	const modifiedRows = useMemo(
		() =>
			Object.keys(edits).map((id) => ({
				driverId: Number(id),
				...edits[id],
			})),
		[edits]
	);

	const handleSaveAll = async () => {
		const updates = modifiedRows.map((u) => ({
			driverId: u.driverId,
			...u,
		}));
		if (updates.length === 0) {
			show('error', 'No changes to save');
			return;
		}
		setSaving(true);
		try {
			const res = await fetch(`${API_BASE}/maintenance/drivers/batch-update`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ updates }),
			});
			const data = await res.json();

			if (data && data.success) {
				show('success', '✅ Driver details updated successfully');
				await fetchDrivers();
			} else {
				console.error('Batch update failed', data);
				show(
					'error',
					(data && (data.error || JSON.stringify(data))) ||
						'Failed to update drivers'
				);
			}
		} catch (e) {
			console.error(e);
			show('error', 'Failed to update drivers');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => setEdits({});

	const filtered = drivers.filter((d) => {
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return (
			(String(d.driverName || '') + ' ' + String(d.truckNo || ''))
				.toLowerCase()
				.includes(q)
		);
	});

	return (
		<div>
			<AnimatedContainer className="mb-4">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold">Maintenance — Drivers</h1>
						<div className="text-sm text-gray-600 mt-1">
							Manage driver details and batch-update records
						</div>
					</div>
					<div className="flex items-center gap-3">
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by name or truck no"
							className="px-3 py-2 rounded-full border border-indigo-300 bg-white text-sm placeholder-gray-500 shadow-sm"
						/>
						<button
							onClick={handleReset}
							className="px-3 py-1 rounded bg-gray-100 text-sm"
						>
							Reset Changes
						</button>
						<button
							disabled={saving || Object.keys(edits).length === 0}
							onClick={handleSaveAll}
							className={`px-3 py-1 rounded text-sm ${
								saving || Object.keys(edits).length === 0
									? 'bg-gray-300 text-gray-600'
									: 'bg-indigo-600 text-white hover:bg-indigo-700'
							}`}
						>
							{saving ? (
								<span className="inline-flex items-center gap-2">
									<svg
										className="w-4 h-4 animate-spin"
										viewBox="0 0 24 24"
									>
										<circle
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="3"
											strokeDasharray="31.4 31.4"
											fill="none"
										/>
									</svg>
									Saving...
								</span>
							) : (
								'Save All Changes'
							)}
						</button>
					</div>
				</div>
			</AnimatedContainer>

			<AnimatedContainer>
				<div className="panel p-3 rounded-2xl border border-indigo-100 relative">
					{loading ? (
						<div className="w-full h-40 flex items-center justify-center">
							<Loading
								size={36}
								className="text-gray-700"
								color="#374151"
							/>
						</div>
					) : (
						<div className="overflow-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead>
									<tr className="bg-gray-50">
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Driver
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Truck No
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Cubic
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Truck Type
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Status
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											TrackerID
										</th>
										<th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
											Password
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filtered.map((d, idx) => {
										const id =
											d.driverId ?? d.id ?? d.driverID;
										const rowEdits = edits[id] || {};
										const rowClass =
											idx % 2 === 0
												? 'bg-white'
												: 'bg-slate-50';
										return (
											<tr key={id} className={`${rowClass}`}>
												<td className="px-4 py-2 w-64">
													<EditableCell
														value={
															rowEdits.driverName ??
															d.driverName
														}
														onChange={(v) =>
															handleEdit(
																id,
																'driverName',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-28">
													<EditableCell
														type="number"
														value={
															rowEdits.truckNo ??
															d.truckNo
														}
														onChange={(v) =>
															handleEdit(
																id,
																'truckNo',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-28">
													<EditableCell
														type="number"
														value={
															rowEdits.cubic ??
															d.cubic
														}
														onChange={(v) =>
															handleEdit(
																id,
																'cubic',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-40">
													<EditableCell
														value={
															rowEdits.truckType ??
															d.truckType
														}
														onChange={(v) =>
															handleEdit(
																id,
																'truckType',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-40">
													<EditableCell
														value={
															rowEdits.status ??
															d.status
														}
														onChange={(v) =>
															handleEdit(
																id,
																'status',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-28">
													<EditableCell
														type="number"
														value={
															rowEdits.TrackerID ??
															d.TrackerID
														}
														onChange={(v) =>
															handleEdit(
																id,
																'TrackerID',
																v
															)
														}
													/>
												</td>
												<td className="px-4 py-2 w-48">
													<EditableCell
														value={
															rowEdits.password ??
															d.password
														}
														onChange={(v) =>
															handleEdit(
																id,
																'password',
																v
															)
														}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							{filtered.length === 0 && (
								<div className="p-4 text-center text-gray-600">
									No drivers found.
								</div>
							)}
						</div>
					)}
				</div>
			</AnimatedContainer>
		</div>
	);
}
