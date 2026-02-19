import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import Pagination from '../../components/common/Pagination';

const AdminReports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [allReports, setAllReports] = useState<any[]>([]); // Store all reports
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await admin.getReports('pending', { limit: 1000 });

            let fetchedReports = [];
            if (Array.isArray(data)) {
                fetchedReports = data;
            } else {
                fetchedReports = data.reports || [];
            }

            setAllReports(fetchedReports);
            setTotalPages(Math.ceil(fetchedReports.length / LIMIT) || 1);

            // Initial slice
            setReports(fetchedReports.slice(0, LIMIT));
            setPage(1); // Reset to first page on new data fetch
        } catch (e) {
            console.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    // Handle page changes
    useEffect(() => {
        const startIndex = (page - 1) * LIMIT;
        setReports(allReports.slice(startIndex, startIndex + LIMIT));
    }, [page, allReports]);

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Pending Reports</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target ID</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    Loading reports...
                                </td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No pending reports found.
                                </td>
                            </tr>
                        ) : (
                            reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm">{report.targetType}</span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-gray-700 dark:text-gray-300">
                                        {report.reason}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                        {report.targetId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-red-500 hover:text-red-700 font-medium text-sm">Resolve</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {!loading && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p)}
                />
            )}
        </div>
    );
};

export default AdminReports;
