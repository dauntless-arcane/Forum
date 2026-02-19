
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface BulkCreateFormProps {
    onSubmit: (users: any[]) => void;
}

const BulkCreateForm = ({ onSubmit }: BulkCreateFormProps) => {
    const [rows, setRows] = useState([{ name: '', email: '', role: 'student' }]);
    const [loading, setLoading] = useState(false);

    const addRow = () => {
        setRows([...rows, { name: '', email: '', role: 'student' }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            const newRows = [...rows];
            newRows.splice(index, 1);
            setRows(newRows);
        }
    };

    const updateRow = (index: number, field: string, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Basic CSV parsing logic
            // Supports formats: Name,Email,Role OR Name,Email
            // Ignores header if first row looks like header
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const newRows: any[] = [];

            lines.forEach((line, index) => {
                // Split by comma, handling basic cases only
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 2) return; // Skip invalid lines

                // Heuristic to skip header
                if (index === 0 && (parts[0].toLowerCase().includes('name') || parts[1].toLowerCase().includes('email'))) {
                    return;
                }

                const name = parts[0];
                const email = parts[1];
                let role = 'student';

                if (parts.length > 2) {
                    const r = parts[2].toLowerCase();
                    if (r === 'admin' || r === 'specialist') {
                        role = r;
                    }
                }

                if (name && email && email.includes('@')) {
                    newRows.push({ name, email, role });
                }
            });

            if (newRows.length > 0) {
                // Keep existing rows if they have data, else replace the empty initial row
                const currentRowsHaveData = rows.some(r => r.name || r.email);
                if (currentRowsHaveData) {
                    setRows([...rows, ...newRows]);
                } else {
                    setRows(newRows);
                }
                alert(`Successfully imported ${newRows.length} users from CSV.`);
            } else {
                alert("No valid users found in CSV. Please ensure format: Name, Email, Role (optional)");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validation
        const validRows = rows.filter(r => r.name && r.email);
        if (validRows.length === 0) return;

        setLoading(true);
        await onSubmit(validRows);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Upload size={16} /> Import from File
                    </h4>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                    Upload a CSV file with columns: <strong>Name, Email, Role (optional)</strong>.
                </p>
                <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm">
                        <span>Select CSV File</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-1"></div>
                </div>
                {rows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={row.name}
                                onChange={(e) => updateRow(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="col-span-4">
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={row.email}
                                onChange={(e) => updateRow(index, 'email', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="col-span-3">
                            <select
                                value={row.role}
                                onChange={(e) => updateRow(index, 'role', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="student">Student</option>
                                <option value="specialist">Specialist</option>
                            </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                            {rows.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addRow}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add another user
            </button>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4" />}
                    Create Users
                </button>
            </div>
        </form>
    );
};

export default BulkCreateForm;
