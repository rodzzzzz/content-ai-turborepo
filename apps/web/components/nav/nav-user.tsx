'use client';

import {
    BadgeCheck,
    ChevronsUpDown,
    CreditCard,
    LifeBuoy,
    LogOut,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
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
import { getInitials, formatDollars } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { DEFAULT_LOGOUT_REDIRECT } from '@/lib/routes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSubscription } from '@/contexts/subscription-context';
import { Skeleton } from '../ui/skeleton';

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
}) {
    const router = useRouter();
    const { isMobile } = useSidebar();
    const { usageMetrics, isTrial } = useSubscription();

    async function handleSignOut() {
        await authClient.signOut();
        router.push(DEFAULT_LOGOUT_REDIRECT);
        router.refresh();
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs">
                                    {user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        CN
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link href="/account">
                                <DropdownMenuItem>
                                    <BadgeCheck />
                                    Account
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/subscription">
                                <DropdownMenuItem>
                                    <CreditCard />
                                    Subscription & Usage
                                </DropdownMenuItem>
                            </Link>
                            <Link href="#">
                                <DropdownMenuItem>
                                    <LifeBuoy />
                                    Help
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <div className="flex flex-col gap-2 p-2 text-sm">
                            <p className="mb-1 text-muted-foreground">
                                Credit Balance
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <p>Monthly Credits</p>
                                {usageMetrics ? (
                                    <p className="text-muted-foreground">
                                        {formatDollars(
                                            usageMetrics.credits.monthly,
                                        )}
                                    </p>
                                ) : (
                                    <Skeleton className="h-4 w-12" />
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p>Purchased Credits</p>
                                {usageMetrics ? (
                                    <p className="text-muted-foreground">
                                        {formatDollars(
                                            usageMetrics.credits.purchased,
                                        )}
                                    </p>
                                ) : (
                                    <Skeleton className="h-4 w-12" />
                                )}
                            </div>
                            {isTrial && (
                                <div className="mt-1 rounded-md bg-blue-100 p-2 text-sm text-blue-800">
                                    Upgrade your plan to buy more credits.
                                    <Link
                                        href="/subscription"
                                        className="ml-1 font-bold text-blue-800 underline"
                                    >
                                        Upgrade plan
                                    </Link>
                                </div>
                            )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void handleSignOut()}>
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
