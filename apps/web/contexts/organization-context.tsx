'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Organization } from '@prisma/client';
import { z } from 'zod';
import {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizations,
} from '@/actions/organization';
import { toast } from '@/hooks/use-toast';

// Schema for organization creation/update
const organizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
});

type OrganizationInput = z.infer<typeof organizationSchema>;
type OrganizationData = Pick<Organization, 'id' | 'name' | 'isDefault'>;

interface OrganizationContextType {
    organizations: OrganizationData[];
    isLoading: boolean;
    createOrg: (data: OrganizationInput) => Promise<void>;
    updateOrg: (id: string, data: OrganizationInput) => Promise<void>;
    deleteOrg: (id: string) => Promise<void>;
    invalidateOrganizations: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
    undefined,
);

export function OrganizationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = useQueryClient();

    // Use React Query to fetch organizations
    const { data: organizations = [], isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            // Check session storage first
            const sessionOrgs = sessionStorage.getItem('organizations');
            const cachedOrgs = sessionOrgs ? JSON.parse(sessionOrgs) : [];

            if (cachedOrgs.length > 0) {
                return cachedOrgs;
            }

            // If not in session storage, fetch from DB
            const result = await getOrganizations();
            if ('error' in result) {
                throw new Error(result.error);
            }

            // Save to session storage
            sessionStorage.setItem(
                'organizations',
                JSON.stringify(result.organizations),
            );
            return result.organizations;
        },
    });

    const createOrg = async (data: OrganizationInput) => {
        try {
            const result = await createOrganization(data.name);
            if ('error' in result) {
                throw new Error(result.error);
            }

            // Update both React Query cache and session storage
            queryClient.setQueryData<OrganizationData[]>(
                ['organizations'],
                (old = []) => {
                    const newOrgs = [...old, result.organization];
                    sessionStorage.setItem(
                        'organizations',
                        JSON.stringify(newOrgs),
                    );
                    return newOrgs;
                },
            );

            toast({
                title: 'Organization created successfully',
                description: 'Your new organization has been created',
            });
        } catch (error) {
            throw error;
        }
    };

    const updateOrg = async (id: string, data: OrganizationInput) => {
        try {
            const result = await updateOrganization(id, data.name);
            if ('error' in result) {
                throw new Error(result.error);
            }

            // Update both the list and individual caches
            queryClient.setQueryData<OrganizationData[]>(
                ['organizations'],
                (old = []) => {
                    const newOrgs = old.map((org) =>
                        org.id === result.organization.id
                            ? result.organization
                            : org,
                    );
                    sessionStorage.setItem(
                        'organizations',
                        JSON.stringify(newOrgs),
                    );
                    return newOrgs;
                },
            );

            queryClient.setQueryData(
                ['organization', result.organization.id],
                result.organization,
            );

            toast({
                title: 'Organization updated successfully',
                description: 'Your organization has been updated',
            });
        } catch (error) {
            toast({
                title: 'Error updating organization',
                description: 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteOrg = async (id: string) => {
        try {
            const result = await deleteOrganization(id);
            if ('error' in result) {
                throw new Error(result.error);
            }

            // Remove from both list and individual caches
            queryClient.setQueryData<OrganizationData[]>(
                ['organizations'],
                (old = []) => {
                    const newOrgs = old?.filter((org) => org.id !== id) || [];
                    sessionStorage.setItem(
                        'organizations',
                        JSON.stringify(newOrgs),
                    );
                    return newOrgs;
                },
            );

            queryClient.removeQueries({
                queryKey: ['organization', id],
            });

            toast({
                title: 'Organization deleted successfully',
                description: 'Your organization has been deleted',
            });
        } catch (error) {
            toast({
                title: 'Error deleting organization',
                description: 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const invalidateOrganizations = () => {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
    };

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                isLoading,
                createOrg,
                updateOrg,
                deleteOrg,
                invalidateOrganizations,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);

    if (!context) {
        throw new Error(
            'useOrganization must be used within an OrganizationProvider',
        );
    }

    return context;
}
