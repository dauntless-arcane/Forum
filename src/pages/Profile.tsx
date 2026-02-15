import { useState } from 'react';
import { User, CheckCircle, Edit, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as userApi } from '../services/api';

export default function Profile() {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        profession: user?.profession || '',
        expertise: user?.expertise?.join(', ') || '',
        avatar: user?.avatar || '👤',
    });

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <p>Please log in to view your profile.</p>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const expertiseArray = formData.expertise.split(',').map(s => s.trim()).filter(Boolean);
            const updateData = {
                ...formData,
                expertise: expertiseArray
            };

            const { data } = await userApi.updateProfile(updateData);
            setUser(data.user); // Update context
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">

                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-4">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg flex items-center justify-center text-6xl">
                                {user.avatar || '👤'}
                            </div>
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    {user.name}
                                    {user.verified && <CheckCircle size={20} className="text-blue-500" />}
                                </h1>
                                <p className="text-gray-600 dark:text-slate-400 capitalize">{user.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center gap-2 px-4 py-2 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Edit size={16} />
                            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                            {success}
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Avatar (Emoji)
                                </label>
                                <input
                                    type="text"
                                    name="avatar"
                                    value={formData.avatar}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                    placeholder="e.g. 👤"
                                />
                            </div>

                            {user.role === 'specialist' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Profession
                                        </label>
                                        <input
                                            type="text"
                                            name="profession"
                                            value={formData.profession}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Expertise (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="expertise"
                                            value={formData.expertise}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                            placeholder="e.g. Anxiety, Career Counseling, CV Review"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {user.role === 'specialist' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Briefcase className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-slate-100">Profession</h3>
                                            <p className="text-gray-600 dark:text-slate-400">{user.profession || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-slate-100">Expertise</h3>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {user.expertise?.map(tag => (
                                                    <span key={tag} className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                                                        {tag}
                                                    </span>
                                                )) || <span className="text-gray-500 text-sm">No expertise listed</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-beige/30 dark:border-slate-700 pt-6">
                                <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-4">Account Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-500 block">Email</span>
                                        <span className="text-gray-900 dark:text-slate-100">{user.email || 'hidden'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-500 block">Member Since</span>
                                        <span className="text-gray-900 dark:text-slate-100">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
