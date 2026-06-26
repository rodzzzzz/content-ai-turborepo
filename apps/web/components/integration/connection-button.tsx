'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';

interface ConnectionButtonProps {
    id: string;
    isConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    accountName?: string;
    accountType?: string;
}

export function ConnectionButton({
    id,
    isConnected,
    isConnecting,
    onConnect,
    onDisconnect,
    accountName,
    accountType,
}: ConnectionButtonProps) {
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

    const handleToggle = () => {
        if (isConnected) {
            setShowDisconnectDialog(true);
        } else {
            onConnect();
        }
    };

    const handleConfirmDisconnect = () => {
        onDisconnect();
    };

    return (
        <>
            <div className="relative">
                {isConnecting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <Switch
                        id={`${id}-toggle`}
                        checked={isConnected}
                        onCheckedChange={handleToggle}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                    />
                )}
            </div>

            <AlertDialog
                open={showDisconnectDialog}
                onOpenChange={setShowDisconnectDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to disconnect your{' '}
                            {accountType || 'account'} &quot;{accountName}
                            &quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDisconnect}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
