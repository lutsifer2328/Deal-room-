'use client';

import { useState } from 'react';

interface AvatarProps {
    name: string;
    avatarUrl?: string | null;
    /** Pixel diameter. Defaults to 40. */
    size?: number;
    className?: string;
}

/**
 * Person avatar: renders the photo when one exists, otherwise the initial on the
 * teal→navy gradient used across the app (see UserManagementTable). Falls back to
 * initials if the image fails to load.
 */
export default function Avatar({ name, avatarUrl, size = 40, className = '' }: AvatarProps) {
    const [imgFailed, setImgFailed] = useState(false);
    const initial = (name?.trim()?.charAt(0) || '?').toUpperCase();
    const dimension = { width: size, height: size };

    if (avatarUrl && !imgFailed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- avatars have no fixed host; next/image remote config not warranted for optional headshots
            <img
                src={avatarUrl}
                alt={name}
                style={dimension}
                onError={() => setImgFailed(true)}
                className={`rounded-full object-cover flex-shrink-0 shadow-md ${className}`}
            />
        );
    }

    return (
        <div
            style={dimension}
            className={`rounded-full bg-gradient-to-br from-teal to-navy-primary flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${className}`}
        >
            <span style={{ fontSize: size * 0.42 }}>{initial}</span>
        </div>
    );
}
