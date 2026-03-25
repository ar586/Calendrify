import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Calendrify',
        short_name: 'Calendrify',
        description: 'An intuitive academic scheduling application',
        start_url: '/',
        display: 'standalone',
        background_color: '#F6F5ED',
        theme_color: '#8C4A32',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
