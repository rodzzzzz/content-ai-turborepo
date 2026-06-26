import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    isConnected: boolean;
    error?: string;
    accountName?: string;
    accountType?: string;
    profilePicture?: string;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    daysUntilExpiration?: number | null;
}

export function StatusBadge({
    isConnected,
    error,
    accountName,
    accountType,
    profilePicture,
    isExpired,
    isExpiringSoon,
    daysUntilExpiration,
}: StatusBadgeProps) {
    if (error) {
        return (
            <div className="bg-destructive/10 px-6 py-[13px] text-sm font-medium text-destructive">
                {`Error: ${error}`}
            </div>
        );
    }

    if (isConnected) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 bg-green-100 px-6 py-3',
                    isExpired && 'bg-red-100',
                    isExpiringSoon && 'bg-yellow-100',
                )}
            >
                {profilePicture && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={profilePicture}
                            alt={accountName || 'Account'}
                        />
                        <AvatarFallback className="text-xs">
                            {accountName?.charAt(0) || 'A'}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'truncate text-sm font-medium text-green-700',
                            isExpired && 'text-red-700',
                            isExpiringSoon && 'text-yellow-700',
                        )}
                    >
                        {accountName}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {isExpired ? (
                        <Badge className="bg-red-700 px-1 py-0.5 capitalize text-white hover:bg-red-800">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Expired
                        </Badge>
                    ) : isExpiringSoon ? (
                        <Badge className="bg-yellow-700 px-1 py-0.5 capitalize text-white hover:bg-yellow-800">
                            {`Expires in ${daysUntilExpiration} ${daysUntilExpiration === 1 ? 'day' : 'days'}`}
                        </Badge>
                    ) : (
                        <Badge className="bg-green-700 px-1 py-0.5 capitalize text-white hover:bg-green-800">
                            {accountType}
                        </Badge>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-muted px-6 py-[13px] text-sm font-medium text-muted-foreground">
            Not connected
        </div>
    );
}
