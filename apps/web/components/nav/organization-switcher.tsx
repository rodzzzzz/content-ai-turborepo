'use client';

import { useState, useEffect, useTransition } from 'react';
import { ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Organization } from '@prisma/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { OrganizationCreateDialog } from './organization-create-dialog';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/organization-context';
import { changeOrganization } from '@/actions/organization';
import { toast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/subscription-context';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-provider';

type OrganizationData = Pick<Organization, 'id' | 'name' | 'isDefault'>;

export function OrganizationSwitcher() {
    const { isMobile } = useSidebar();
    const sessionOrganization = useCurrentOrganization();
    const { organizations, isLoading } = useOrganization();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { refetch } = useAuth();
    const [isPending, startTransition] = useTransition();
    const {
        canCreateOrganization,
        isLoading: isLoadingSubscription,
        isRefetching: isRefetchingSubscription,
    } = useSubscription();

    const [activeOrganization, setActiveOrganization] =
        useState<OrganizationData | null>(null);

    useEffect(() => {
        if (organizations.length > 0 && !activeOrganization) {
            // If we have a sessionOrganization, use it to find the matching org
            // Otherwise, fallback to the first organization (e.g., after onboarding
            // when session might not be updated yet but organizations are loaded)
            if (sessionOrganization) {
                const defaultOrg = organizations.find(
                    (org: OrganizationData) => org.id === sessionOrganization,
                );
                setActiveOrganization(defaultOrg || organizations[0]);
            } else {
                // Fallback: use the first organization or default organization
                const defaultOrg =
                    organizations.find((org) => org.isDefault) ||
                    organizations[0];
                setActiveOrganization(defaultOrg);
            }
        }
    }, [organizations, activeOrganization, sessionOrganization]);

    async function handleOrganizationChange(organization: OrganizationData) {
        setActiveOrganization(organization);

        startTransition(async () => {
            try {
                const data = await changeOrganization(organization.id);

                if (data.error) {
                    toast({
                        title: data.error,
                        description:
                            'Organization was not changed. Please try again.',
                        variant: 'destructive',
                    });
                    return;
                }

                await refetch();

                // Force a page reload to ensure all components get the new session
                window.location.reload();
            } catch (error) {
                console.error(error);

                toast({
                    title: 'Something went wrong.',
                    description:
                        'Organization was not changed. Please try again.',
                    variant: 'destructive',
                });
            }
        });
    }

    if (isLoading) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" disabled>
                        <div className="flex aspect-square h-8 w-8 animate-pulse items-center justify-center rounded-lg bg-muted-foreground"></div>
                        <div className="grid flex-1">
                            <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground" />
                        </div>
                        <div className="h-5 w-5 animate-pulse rounded bg-muted-foreground"></div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    if (!activeOrganization) {
        return null;
    }

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="hover:bg-background"
                                variant="outline"
                                disabled={isPending}
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <span className="text-lg font-semibold">
                                        {activeOrganization.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {activeOrganization.name}
                                    </span>
                                </div>
                                {isPending ? (
                                    <Loader2 className="ml-auto size-4 animate-spin" />
                                ) : (
                                    <ChevronsUpDown className="ml-auto" />
                                )}
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                            side={isMobile ? 'bottom' : 'right'}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Organizations
                            </DropdownMenuLabel>
                            {organizations.map(
                                (organization: OrganizationData) => (
                                    <DropdownMenuItem
                                        key={organization.id}
                                        onClick={() =>
                                            handleOrganizationChange(
                                                organization,
                                            )
                                        }
                                        className={cn(
                                            'gap-2 p-2',
                                            organization.id ===
                                                activeOrganization?.id &&
                                                'bg-sidebar-accent text-sidebar-accent-foreground',
                                        )}
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-sm border">
                                            <span className="text-sm font-semibold">
                                                {organization.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        {organization.name}
                                    </DropdownMenuItem>
                                ),
                            )}
                            <DropdownMenuSeparator />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <DropdownMenuItem
                                            className="gap-2 p-2"
                                            onClick={() =>
                                                canCreateOrganization() &&
                                                setIsCreateDialogOpen(true)
                                            }
                                            disabled={
                                                !canCreateOrganization() ||
                                                isLoadingSubscription ||
                                                isRefetchingSubscription
                                            }
                                        >
                                            <div className="flex size-6 items-center justify-center rounded-md border bg-primary text-primary-foreground">
                                                {isLoadingSubscription ||
                                                isRefetchingSubscription ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <Plus className="size-4" />
                                                )}
                                            </div>
                                            <div className="font-medium">
                                                Add organization
                                            </div>
                                        </DropdownMenuItem>
                                    </div>
                                </TooltipTrigger>
                                {!canCreateOrganization() &&
                                    !isLoadingSubscription && (
                                        <TooltipContent side="right">
                                            Organization limit reached. Upgrade
                                            your plan to add more.
                                        </TooltipContent>
                                    )}
                            </Tooltip>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <OrganizationCreateDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                handleOrganizationChange={handleOrganizationChange}
            />
        </>
    );
}
