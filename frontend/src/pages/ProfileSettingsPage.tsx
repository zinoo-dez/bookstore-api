import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useUpdateProfile, UpdateProfileData, useUploadAvatar } from '@/services/auth'
import Avatar, { AVATARS, BACKGROUND_COLORS } from '@/components/user/Avatar'
import { cn } from '@/lib/utils'

const ProfileSettingsPage = () => {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const updateProfileMutation = useUpdateProfile()
    const uploadAvatarMutation = useUploadAvatar()

    const [name, setName] = useState(user?.name || '')
    const [avatarType, setAvatarType] = useState<'emoji' | 'upload'>(user?.avatarType || 'emoji')
    const [avatarValue, setAvatarValue] = useState(user?.avatarValue || 'avatar-1')
    const [selectedBg, setSelectedBg] = useState(user?.backgroundColor || 'bg-slate-100')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [activeTab, setActiveTab] = useState<'emoji' | 'upload'>(user?.avatarType || 'emoji')

    useEffect(() => {
        if (user) {
            setName(user.name)
            setAvatarType(user.avatarType || 'emoji')
            setAvatarValue(user.avatarValue || 'avatar-1')
            setSelectedBg(user.backgroundColor || 'bg-slate-100')
            setActiveTab(user.avatarType || 'emoji')
        }
    }, [user])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' })
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File size must be less than 2MB.' })
            return
        }

        try {
            const result = await uploadAvatarMutation.mutateAsync(file)
            // backend returns { url: ... }
            // The url might be relative e.g. /uploads/avatars/file.jpg.
            // Avatar component expects a full URL or relative if handled.
            // Let's assume it works as is.
            setAvatarType('upload')
            setAvatarValue(result.url)
            setMessage({ type: 'success', text: 'Image uploaded successfully!' })
            setTimeout(() => setMessage(null), 3000)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (name.length < 2 || name.length > 30) {
            setMessage({ type: 'error', text: 'Name must be between 2 and 30 characters' })
            return
        }

        // Logic to determine what to send
        let finalAvatarType: 'emoji' | 'upload' = activeTab;
        let finalAvatarValue = avatarValue;

        if (activeTab === 'emoji') {
            // If currently showing emoji tab, we must send an emoji value.
            // If avatarValue is currently a URL (because user switched tabs but didn't select new emoji),
            // we should fall back to a default or valid emoji.
            if (avatarValue.startsWith('/uploads') || avatarValue.includes('/')) {
                finalAvatarValue = 'avatar-1'; // Default Fallback
            }
        } else {
            // Upload tab
            if (!avatarValue || !avatarValue.includes('/')) {
                // No valid image url
                setMessage({ type: 'error', text: 'Please upload an image first.' })
                return
            }
        }

        const data: UpdateProfileData = {
            name,
            avatarType: finalAvatarType,
            avatarValue: finalAvatarValue,
            backgroundColor: selectedBg,
        }

        updateProfileMutation.mutate(data, {
            onSuccess: () => {
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
                setTimeout(() => setMessage(null), 3000)
            },
            onError: (error: any) => {
                setMessage({ type: 'error', text: error.message })
            }
        })
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="mt-2 text-gray-600">Customize your appearance and display name.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Left Column: Preview */}
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <Avatar
                                    avatarType={activeTab}
                                    avatarValue={
                                        activeTab === 'emoji'
                                            ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue)
                                            : avatarValue
                                    }
                                    backgroundColor={selectedBg}
                                    size="xl"
                                    className="mb-4 shadow-md"
                                />
                                <h3 className="text-xl font-bold text-gray-900">{name || 'Your Name'}</h3>
                                {/* <p className="text-sm text-gray-500 mt-1">{user?.role}</p> */}
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="lg:col-span-2 space-y-8">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Avatar Selection Tabs */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Avatar</h2>
                                    <div className="flex space-x-4 mb-6 border-b border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('emoji')}
                                            className={cn(
                                                "pb-2 px-1 text-sm font-medium transition-colors relative",
                                                activeTab === 'emoji' ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            Fun Emoji
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('upload')}
                                            className={cn(
                                                "pb-2 px-1 text-sm font-medium transition-colors relative",
                                                activeTab === 'upload' ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            Upload Image
                                        </button>
                                    </div>

                                    {/* Emoji Selection */}
                                    {activeTab === 'emoji' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-3 sm:grid-cols-6 gap-4"
                                        >
                                            {AVATARS.map((avatar) => (
                                                <div key={avatar.id} className="flex justify-center">
                                                    <Avatar
                                                        avatarType="emoji"
                                                        avatarValue={avatar.id}
                                                        backgroundColor={selectedBg}
                                                        size="md"
                                                        onClick={() => setAvatarValue(avatar.id)}
                                                        className={cn(
                                                            "cursor-pointer transition-all",
                                                            avatarValue === avatar.id ? "ring-4 ring-primary-100 ring-offset-2 scale-110" : "opacity-70 hover:opacity-100 hover:scale-105"
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Upload Selection */}
                                    {activeTab === 'upload' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    className="hidden"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={handleFileUpload}
                                                    disabled={uploadAvatarMutation.isPending}
                                                />
                                                <label
                                                    htmlFor="avatar-upload"
                                                    className="cursor-pointer flex flex-col items-center"
                                                >
                                                    <span className="text-4xl mb-2">☁️</span>
                                                    <span className="text-sm font-medium text-primary-600">Click to upload</span>
                                                    <span className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP up to 2MB</span>
                                                </label>
                                            </div>
                                            {uploadAvatarMutation.isPending && (
                                                <p className="text-sm text-center text-gray-500">Uploading...</p>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Background Color Selection (Only for Emoji) */}
                                {activeTab === 'emoji' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Background Color</h2>
                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                            {BACKGROUND_COLORS.map((bg) => (
                                                <motion.button
                                                    key={bg.id}
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedBg(bg.class)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full border-2 transition-all",
                                                        bg.class,
                                                        selectedBg === bg.class ? "border-primary-600 ring-2 ring-primary-100 ring-offset-1" : "border-transparent hover:border-gray-300"
                                                    )}
                                                    title={bg.id}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Display Name */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Name</h2>
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border"
                                            placeholder="Enter your display name"
                                            minLength={2}
                                            maxLength={30}
                                        />
                                        <p className="mt-1 text-sm text-gray-500">2-30 characters</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                                }`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="mr-3 inline-flex justify-center py-2.5 px-6 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                    >
                                        Done
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileSettingsPage
