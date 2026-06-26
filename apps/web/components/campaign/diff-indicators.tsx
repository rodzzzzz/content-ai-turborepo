
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon, XIcon } from 'lucide-react';
import { AddPostOperation, RemovePostOperation } from '@/types/campaign-update';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface DiffActionsProps {
    entryId: string;
    type: 'add_post' | 'remove_post';
    onApprove: (entryId: string) => void;
    onReject: (entryId: string) => void;
    className?: string;
}

export function DiffActions({
    entryId,
    type,
    onApprove,
    onReject,
    className,
}: DiffActionsProps) {
    const getLabel = () => {
        switch (type) {
            case 'add_post':
                return 'To be added';
            case 'remove_post':
                return 'To be removed';
        }
    };

    const getClassName = () => {
        switch (type) {
            case 'add_post':
                return 'text-green-600 border-green-200';
            case 'remove_post':
                return 'text-red-600 border-red-200';
        }
    };

    return (
        <div className={cn('flex items-center gap-1 bg-background rounded-md p-1 pl-2 shadow-sm border', getClassName(), className)}>
            <p className="text-xs font-bold font-mono mr-2">{getLabel()}</p>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon-xs"
                        variant="outline"
                        className="h-6 w-6 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReject(entryId);
                        }}
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reject</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon-xs"
                        variant="outline"
                        className="h-6 w-6 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onApprove(entryId);
                        }}
                    >
                        <CheckIcon className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Approve</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

interface DiffWrapperProps {
    entry: AddPostOperation | RemovePostOperation;
    children: React.ReactNode;
    className?: string;
}

export function DiffWrapper({ entry, children, className }: DiffWrapperProps) {
    const getBorderColor = () => {
        switch (entry.type) {
            case 'add_post':
                return 'border-green-200 bg-green-50/80';
            case 'remove_post':
                return 'border-red-200 bg-red-50/80';
        }
    };

    return (
        <div
            className={cn(
                'rounded-md transition-colors border',
                getBorderColor(),
                className,
            )}
        >
            {children}
        </div>
    );
}
