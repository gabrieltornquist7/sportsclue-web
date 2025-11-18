'use client'

import { useRef } from 'react'

// Dumb component - no state, no logic, only props and callbacks
export default function AvatarUploader({
  avatarUrl,
  previewUrl,
  username,
  uploading,
  error,
  success,
  hasFile,
  onFileChange,
  onUploadClick,
  onCancel,
}) {
  const fileInputRef = useRef(null)

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onFileChange) {
      onFileChange(file)
    }
  }

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick()
    }
  }

  const handleCancelClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onCancel) {
      onCancel()
    }
  }

  // Display logic: preview takes priority, then avatarUrl prop
  const displayAvatarUrl = previewUrl || avatarUrl

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        Profile Picture
      </label>
      <div className="space-y-4">
        {/* Avatar Preview */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full border-2 border-zinc-700 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-700 bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                {(username || 'U')[0].toUpperCase()}
              </div>
            )}
            {previewUrl && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-200">Preview</span>
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              disabled={uploading}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-500">
              JPG, PNG or WebP. Max 5MB.
            </p>
          </div>
        </div>

        {/* Upload Button (only shown when file is selected) */}
        {hasFile && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={uploading}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-900/20 border border-green-800 p-3 text-sm text-green-400">
            Profile picture updated successfully!
          </div>
        )}
      </div>
    </div>
  )
}
