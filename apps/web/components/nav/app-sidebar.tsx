'use client';

import * as React from 'react';
import {
    Calendar,
    Frame,
    ImageIcon,
    LayoutGrid,
    Map,
    Megaphone,
    PieChart,
    SettingsIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { NavMain } from '@/components/nav/nav-main';
import { NavUser } from '@/components/nav/nav-user';
import { OrganizationSwitcher } from '@/components/nav/organization-switcher';
import { GuidedSetupSidebar } from '@/components/nav/guided-setup-sidebar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { redirect } from 'next/navigation';
import { DEFAULT_LOGOUT_REDIRECT } from '@/routes';

// Navigation data structure
const getNavData = (pathname: string) => ({
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
        {
            title: 'Campaign',
            url: '/campaign',
            icon: Megaphone,
            isActive: pathname.startsWith('/campaign'),
        },
        {
            title: 'Analytics',
            url: '/analytics',
            icon: LayoutGrid,
            isActive: pathname.startsWith('/analytics'),
        },
        {
            title: 'Schedule',
            url: '/schedule',
            icon: Calendar,
            isActive: pathname.startsWith('/schedule'),
        },
        {
            title: 'Media',
            url: '/media',
            icon: ImageIcon,
            isActive: pathname.startsWith('/media'),
        },
        //{ title: 'Workflow', url: '/workflows', icon: SquareTerminal },
        {
            title: 'Settings',
            url: '/settings',
            icon: SettingsIcon,
            isActive: pathname.startsWith('/settings'),
            items: [
                {
                    title: 'Integrations',
                    url: '/settings/integrations',
                    isActive: pathname.startsWith('/settings/integrations'),
                },
                {
                    title: 'Tone & Personality',
                    url: '/settings/tone',
                    isActive: pathname.startsWith('/settings/tone'),
                },
                {
                    title: 'Company Knowledge',
                    url: '/settings/knowledge',
                    isActive: pathname.startsWith('/settings/knowledge'),
                },
                {
                    title: 'Brand Kit',
                    url: '/settings/brand',
                    isActive: pathname.startsWith('/settings/brand'),
                    upcoming: true,
                },
            ],
        },
    ],
    projects: [
        {
            name: 'Design Engineering',
            url: '#',
            icon: Frame,
        },
        {
            name: 'Sales & Marketing',
            url: '#',
            icon: PieChart,
        },
        {
            name: 'Travel',
            url: '#',
            icon: Map,
        },
    ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const user = useCurrentUser();
    const pathname = usePathname();

    if (!user) {
        redirect(DEFAULT_LOGOUT_REDIRECT);
    }

    const navData = getNavData(pathname);

    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader>
                <OrganizationSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navData.navMain} />
                {/* <NavProjects projects={navData.projects} /> */}
            </SidebarContent>
            <SidebarFooter>
                <GuidedSetupSidebar />
                <NavUser
                    user={{
                        name: user.name!,
                        email: user.email!,
                        avatar: user.image!,
                    }}
                />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
