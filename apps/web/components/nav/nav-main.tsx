'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export function NavMain({
    items,
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        upcoming?: boolean;
        items?: {
            title: string;
            url: string;
            isActive?: boolean;
            upcoming?: boolean;
        }[];
    }[];
}) {
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <SidebarGroup>
            {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
            <SidebarMenu>
                {items.map((item) =>
                    !!item.items ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive}
                            className="group/collapsible"
                            onClick={() => isCollapsed && toggleSidebar()}
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={item.isActive && isCollapsed}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={subItem.isActive}
                                                >
                                                    <a
                                                        href={subItem.url}
                                                        className={cn(
                                                            'relative',
                                                            !!subItem.upcoming &&
                                                                'pointer-events-none cursor-not-allowed overflow-hidden opacity-50',
                                                        )}
                                                    >
                                                        <span className="truncate whitespace-nowrap">
                                                            {subItem.title}
                                                        </span>
                                                        {subItem.upcoming && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="absolute right-0 whitespace-nowrap px-1.5 py-0 text-[10px]"
                                                            >
                                                                Coming Soon
                                                            </Badge>
                                                        )}
                                                    </a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild
                                isActive={item.isActive}
                            >
                                <a href={item.url}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
