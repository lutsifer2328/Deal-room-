import type { MetadataRoute } from 'next';

// PWA manifest — lets clients "Add to Home Screen" and open the deal room as
// an app. Next serves this at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Agenzia Deal Room',
        short_name: 'Deal Room',
        description: 'Secure Real Estate Transaction Portal',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
    };
}
