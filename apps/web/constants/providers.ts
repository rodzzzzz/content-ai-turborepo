export interface Provider {
    provider: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'pinterest';
    name: string;
    description: string;
    icon: string;
}

export const providers: Provider[] = [
    {
        provider: 'facebook',
        name: 'Facebook',
        description: 'Connect your Facebook account to your account.',
        icon: '/facebook.svg',
    },
    // {
    //     provider: 'instagram',
    //     name: 'Instagram',
    //     description: 'Manage visual content effectively.',
    //     icon: '/instagram.svg',
    // },
    {
        provider: 'linkedin',
        name: 'LinkedIn',
        description: 'Connect your LinkedIn account to your account.',
        icon: '/linkedin.svg',
    },
    {
        provider: 'twitter',
        name: 'Twitter',
        description: 'Connect your Twitter account to your account.',
        icon: '/twitter.svg',
    },
    // {
    //     provider: 'pinterest',
    //     name: 'Pinterest',
    //     description: 'Discover and share visual content.',
    //     icon: '/pinterest.svg',
    // },
];
