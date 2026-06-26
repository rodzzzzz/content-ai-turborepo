'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Organization } from '@prisma/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/subscription-context';

const organizationCreateSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
});

type OrganizationCreateFormData = z.infer<typeof organizationCreateSchema>;

type OrganizationData = Pick<Organization, 'id' | 'name' | 'isDefault'>;

interface OrganizationCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    handleOrganizationChange: (organization: OrganizationData) => void;
}

export function OrganizationCreateDialog({
    open,
    onOpenChange,
    handleOrganizationChange,
}: OrganizationCreateDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { createOrg, organizations } = useOrganization();
    const {
        canCreateOrganization,
        usageMetrics,
        remainingOrganizations,
        refetch: refetchSubscription,
    } = useSubscription();

    const form = useForm<OrganizationCreateFormData>({
        resolver: zodResolver(organizationCreateSchema),
        defaultValues: {
            name: '',
        },
    });

    const onSubmit = async (data: OrganizationCreateFormData) => {
        if (!canCreateOrganization()) {
            return;
        }

        try {
            setIsLoading(true);
            await createOrg(data);

            onOpenChange(false);
            form.reset();
            toast({
                title: 'Success',
                description: 'Organization created successfully',
            });

            refetchSubscription();

            // Find the newly created organization by name
            const newOrg = organizations.find((org) => org.name === data.name);
            if (newOrg) {
                handleOrganizationChange(newOrg);
            }
        } catch (error) {
            toast({
                title: 'Error creating organization',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                    <DialogDescription>
                        Create a new organization to manage your team.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Organization name"
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {usageMetrics && canCreateOrganization() && (
                            <div className="rounded-md border border-muted bg-muted/50 p-3 text-sm text-muted-foreground">
                                <p>
                                    {remainingOrganizations} organization
                                    {remainingOrganizations !== 1
                                        ? 's'
                                        : ''}{' '}
                                    remaining ({usageMetrics.organizations.used}{' '}
                                    of {usageMetrics.organizations.total} used)
                                </p>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !canCreateOrganization()}
                            >
                                {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Create
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
