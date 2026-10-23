export interface MeLink {
    id: string;
    name: string;
    url: string;
    icon?: string; // lucide icon name
    type: 'social' | 'external' | 'internal';
}

export interface MeConfig {
    site?: {
        maintenanceEnabled: boolean;
        guestbookEnabled?: boolean;
        profileEnabled?: boolean;
        newsletterEnabled?: boolean;
        newsletterShowHome?: boolean;
        newsletterShowProfile?: boolean;
        contactEnabled?: boolean;
        statusPageEnabled?: boolean;
        statusBadgeEnabled?: boolean;
    };
    profile: {
        handle: string;
        bio: string;
        fontTheme?: 'outfit' | 'geist-sans' | 'geist-mono' | 'geist-pixel' | 'inter' | 'space-mono' | 'instrument-serif';
        visualTheme?: 'primary' | 'lunar' | 'editorial' | 'sunset' | 'signal' | 'ocean' | 'botanical' | 'neon' | 'christmas' | 'new-year' | 'gallery' | 'orbit' | 'brutalist' | 'studio' | 'kinetic';
        avatarUrl: string;
        logoUrl?: string; // nav logo
        bannerUrl?: string; // for gallery card
        themeColor?: string; // for buttons
        status?: {
            text: string; // "Busy", "Free", "Coding"
            color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
        };
        presence?: {
            mode: 'manual' | 'auto';
            discordId?: string;
            serverTagEnabled?: boolean;
            badgesEnabled?: boolean;
            badgesMode?: 'auto' | 'manual';
            badgesManual?: Record<string, boolean>;
        };
        location?: string;
        weatherCoordinates?: { latitude: number; longitude: number };
        weatherEnabled?: boolean;
    };
    music: {
        title: string;
        artist: string;
        coverUrl: string;
        audioUrl: string;
        youtubeVideoId?: string;
        spotifyEnabled?: boolean;
        spotifyAmbientEnabled?: boolean;
    };
    links: MeLink[];
    gallery: {
        id: string;
        type: 'image' | 'video';
        url: string;
        muxAssetId?: string;
        caption?: string;
    }[];
    resources: {
        id: string;
        title: string;
        url: string;
        type: 'gallery' | 'doc' | 'post';
        previewUrl?: string; // for posts
        meta?: string; // e.g. "avrxt-resend-2025"
    }[];
    widgets?: {
        quotesEnabled: boolean;
        notesEnabled: boolean;
        note?: {
            text: string;
            createdAt: string;
        };
    };
}

export const defaultMeConfig: MeConfig = {
    site: {
        maintenanceEnabled: false,
        guestbookEnabled: true,
        profileEnabled: true,
        newsletterEnabled: true,
        newsletterShowHome: true,
        newsletterShowProfile: true,
        contactEnabled: true,
        statusPageEnabled: true,
        statusBadgeEnabled: true,
    },
    profile: {
        handle: "@aviorxt",
        bio: "Independent developer and aircraft maintenance engineer based in India.",
        fontTheme: 'outfit',
        visualTheme: 'primary',
        avatarUrl: "https://cdn.avxt.qzz.io/assets/IMG_20251108_224641_264.webp",
        logoUrl: "/assets/logo/avrxt-pure-white.png",
        bannerUrl: "https://cdn.avxt.qzz.io/images/aviorxt_01.jpg",
        themeColor: "#ffffff",
        status: { text: 'Online', color: 'green' },
        presence: {
            mode: 'manual',
            discordId: '1269352892146384957',
            serverTagEnabled: true,
            badgesEnabled: true,
            badgesMode: 'auto',
            badgesManual: {}
        }
    },
    music: {
        title: "her",
        artist: "JVKE",
        coverUrl: "https://cdn.avxt.qzz.io/assets/ab67616d0000b273a0934c15232680a3afc9da6e.jpeg",
        audioUrl: "https://cdn.avxt.qzz.io/assets/SpotiDownloader.com%20-%20her%20-%20JVKE.mp3",
        youtubeVideoId: "",
        spotifyEnabled: false,
        spotifyAmbientEnabled: false
    },
    links: [
        { id: '1', name: 'Instagram', url: 'https://www.instagram.com/aviorxt/', icon: 'Instagram', type: 'social' },
        { id: '2', name: 'GitHub', url: 'https://github.com/aviorxt', icon: 'Github', type: 'social' },
        { id: '3', name: 'Discord', url: 'https://discord.com/users/1269352892146384957', icon: 'Discord', type: 'social' },
        { id: '4', name: 'Email', url: 'mailto:hey@avrxt.dev', icon: 'Mail', type: 'social' }
    ],
    gallery: [],
    resources: [
        { id: 'r2', title: 'Documentation Portal', url: '/docs', type: 'doc' },
        { id: 'r3', title: 'Browse Technical Writing', url: '/docs', type: 'doc' }
    ],
    widgets: {
        quotesEnabled: true,
        notesEnabled: true,
        note: { text: "Hello! Check out my work.", createdAt: new Date().toISOString() }
    }
};
