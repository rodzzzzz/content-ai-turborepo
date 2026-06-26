'use client';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';

interface CampaignDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
}

export function CampaignDeleteDialog({
    open,
    onOpenChange,
    campaignId,
}: CampaignDeleteDialogProps) {
    const { deleteCampaign, isDeletingCampaign } = useCampaignChatStore();

    const handleDelete = async () => {
        try {
            await deleteCampaign(campaignId);

            toast({
                description: 'Campaign has been deleted.',
            });

            onOpenChange(false);
        } catch (error) {
            console.error(error);

            toast({
                title: 'Something went wrong.',
                description: 'Campaign was not deleted. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this campaign?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    This campaign will be permanently deleted. This action
                    cannot be undone.
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeletingCampaign}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeletingCampaign}
                    >
                        {isDeletingCampaign && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
