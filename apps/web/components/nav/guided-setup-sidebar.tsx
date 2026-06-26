'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRightIcon, Circle } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProgressCircle } from '../ui/progress-circle';
import { Separator } from '../ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '../ui/badge';
import { isEmpty } from 'lodash';
import { SetupStep } from '@/types/setup';

function getSetupStatus(setupSteps: SetupStep['id'][]) {
    const steps: SetupStep[] = [
        {
            id: 'integrations',
            label: 'Connect social media accounts',
            completed: setupSteps.includes('integrations'),
            route: '/settings/integrations',
        },
        {
            id: 'personality',
            label: 'Set tone & personality',
            completed: setupSteps.includes('personality'),
            route: '/settings/tone',
        },
        {
            id: 'companyInfo',
            label: 'Add organization information',
            completed: setupSteps.includes('companyInfo'),
            route: '/settings/knowledge',
        },
    ];

    const completedCount = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = Math.round((completedCount / totalSteps) * 100);
    const isComplete = completedCount === totalSteps;

    return {
        steps: steps.sort((a, b) => (a.completed ? 1 : b.completed ? -1 : 0)),
        completedCount,
        totalSteps,
        progressPercentage,
        isComplete,
    };
}

export function GuidedSetupSidebar() {
    const router = useRouter();
    const user = useCurrentUser();
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const isMobile = useIsMobile();

    if (!user) {
        return null;
    }

    const setupStatus = getSetupStatus(
        (user.setupSteps ?? []) as SetupStep['id'][],
    );

    const handleStepClick = (route: string) => {
        router.push(route);
    };

    // Don't show if setup status not available or complete
    if (isEmpty(setupStatus) || setupStatus.isComplete) {
        return null;
    }

    if (isCollapsed && !isMobile) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="mb-3 [&_svg]:size-8"
                                    onClick={() => {
                                        // Expand sidebar on click when collapsed
                                        if (isCollapsed) {
                                            toggleSidebar();
                                        }
                                    }}
                                >
                                    <ProgressCircle
                                        value={setupStatus.progressPercentage}
                                        className="text-primary/80"
                                        backgroundColor="stroke-primary/10"
                                    />
                                    <p className="absolute text-[10px] font-bold">
                                        {`${setupStatus.completedCount}/${setupStatus.totalSteps}`}
                                    </p>
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        align="end"
                        className="w-64 border border-border bg-card p-3 text-foreground shadow-md"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    Setup Progress
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="px-1.5 py-0.5 text-[10px]"
                                >
                                    {`${setupStatus.completedCount} of ${setupStatus.totalSteps} completed`}
                                </Badge>
                            </div>

                            <div className="space-y-1">
                                {setupStatus.steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            'flex items-center gap-2 text-xs text-muted-foreground',
                                            step.completed && 'text-green-600',
                                        )}
                                    >
                                        {step.completed ? (
                                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                                        ) : (
                                            <Circle className="h-3 w-3 shrink-0" />
                                        )}
                                        <span>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="mb-3 rounded-lg border border-sidebar-border bg-card shadow-md">
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex flex-1 flex-col">
                                <p className="truncate text-sm font-semibold">
                                    Account Setup
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {setupStatus.completedCount} of{' '}
                                    {setupStatus.totalSteps} completed
                                </p>
                            </div>

                            <ProgressCircle
                                value={setupStatus.progressPercentage}
                                className="h-5 w-5 text-primary/80"
                                backgroundColor="stroke-primary/10"
                            />
                        </div>

                        <Separator />

                        <div className="space-y-1 p-2">
                            {setupStatus.steps.map((step) => (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title={step.label}
                                    key={step.id}
                                    onClick={() => handleStepClick(step.route)}
                                    className={cn(
                                        'w-full justify-start px-2 text-muted-foreground',
                                        step.completed &&
                                            'bg-green-50 text-green-600 disabled:opacity-100',
                                    )}
                                    disabled={step.completed}
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                                    ) : (
                                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="truncate text-xs">
                                        {step.label}
                                    </span>
                                    {!step.completed && (
                                        <ChevronRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
