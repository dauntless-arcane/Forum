import React, { useState, useEffect } from 'react';
import { Rocket, Save, Copy, AlertTriangle } from 'lucide-react';
import { config } from '../../services/api';

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ isLaunched: boolean, launchDate: string, bypassToken?: string, allowSignups?: boolean, questionRateLimit?: number }>({
        isLaunched: true,
        launchDate: new Date().toISOString().slice(0, 16),
        bypassToken: '',
        allowSignups: true,
        questionRateLimit: 5
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const { data } = await config.getLaunchStatus();

            // Fix datetime-local UTC offset shift
            const localDate = new Date(data.launchDate || Date.now());
            const tzOffset = localDate.getTimezoneOffset() * 60000;
            const formattedDate = new Date(localDate.getTime() - tzOffset).toISOString().slice(0, 16);

            setStatus({
                isLaunched: data.isLaunched,
                launchDate: formattedDate,
                bypassToken: data.bypassToken || '',
                allowSignups: data.allowSignups !== false, // default true
                questionRateLimit: data.questionRateLimit || 5
            });
        } catch (error) {
            console.error("Failed to fetch launch config", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const { data } = await config.updateLaunchStatus({
                isLaunched: status.isLaunched,
                launchDate: new Date(status.launchDate).toISOString(),
                allowSignups: status.allowSignups,
                questionRateLimit: status.questionRateLimit,
                generateToken: !status.bypassToken
            });
            if (data.bypassToken) {
                setStatus(prev => ({ ...prev, bypassToken: data.bypassToken }));
                localStorage.setItem('adminBypassToken', data.bypassToken);
            }
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Failed to update config", error);
            alert("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };




    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Configuration...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white capitalize flex items-center gap-3">
                    <Rocket className="text-blue-500" /> Platform Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage global launch state, registration, and rate limiting.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">

                {/* Launch Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Launch Configuration</h3>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                        <div className="flex-1">
                            <label className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                Platform Status
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                {status.isLaunched
                                    ? "Platform is LIVE and open to the public."
                                    : "Platform is LOCKED. Users will see the Launching Soon screen."}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={status.isLaunched}
                                onChange={(e) => setStatus(prev => ({ ...prev, isLaunched: e.target.checked }))}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Countdown Target Date (Local Time)</label>
                        <input
                            type="datetime-local"
                            required
                            value={status.launchDate}
                            onChange={e => setStatus(prev => ({ ...prev, launchDate: e.target.value }))}
                            onClick={(e) => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm cursor-pointer"
                        />
                    </div>

                    {status.bypassToken && !status.isLaunched && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4">
                            <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} /> Admin Bypass Access
                            </h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                Share this URL with your team to bypass the locked screen.
                            </p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}?token=${status.bypassToken}`}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}?token=${status.bypassToken}`);
                                        alert("URL Copied to clipboard!");
                                    }}
                                    className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                                >
                                    <Copy size={14} /> Copy URL
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* General Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Global Constraints</h3>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                        <div className="flex-1">
                            <label className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                Allow New Registrations
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                Control whether new users can sign up for the platform.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={status.allowSignups}
                                onChange={(e) => setStatus(prev => ({ ...prev, allowSignups: e.target.checked }))}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Question Rate Limit (per hour)</label>
                        <input
                            type="number"
                            min="1"
                            // max="50"
                            required
                            value={status.questionRateLimit}
                            onChange={e => setStatus(prev => ({ ...prev, questionRateLimit: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm"
                        />
                        <p className="text-xs text-slate-500 mt-2">The maximum number of questions a normal user can post within a 1-hour rolling window.</p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                    >
                        {saving ? <Copy size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Configuration
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
