'use client';

import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface ReconnectButtonProps {
    isReconnecting: boolean;
    onReconnect: () => void;
}

export function ReconnectButton({
    isReconnecting,
    onReconnect,
}: ReconnectButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            disabled={isReconnecting}
            className="gap-2"
        >
            {isReconnecting ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Reconnecting...</span>
                </>
            ) : (
                <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Reconnect</span>
                </>
            )}
        </Button>
    );
}
