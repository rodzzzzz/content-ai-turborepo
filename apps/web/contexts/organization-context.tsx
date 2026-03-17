'use client';

import type React from 'react';
import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizations,
} from '@/actions/organization';
import { toast } from '@/hooks/use-toast';

interface OrganizationData {
  id: string;
  name: string;
  isDefault: boolean;
}

interface OrganizationContextType {
  organizations: OrganizationData[];
  isLoading: boolean;
  createOrg: (data: { name: string }) => Promise<void>;
  updateOrg: (id: string, data: { name: string }) => Promise<void>;
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

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      if (typeof window !== 'undefined') {
        const sessionOrgs = sessionStorage.getItem('organizations');
        const cachedOrgs = sessionOrgs ? JSON.parse(sessionOrgs) : [];
        if (cachedOrgs.length > 0) return cachedOrgs;
      }

      const result = await getOrganizations();
      if ('error' in result) throw new Error(result.error);

      const orgs = result.organizations ?? [];
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('organizations', JSON.stringify(orgs));
      }
      return orgs;
    },
  });

  const createOrg = async (data: { name: string }) => {
    try {
      const result = await createOrganization(data.name);
      if ('error' in result) throw new Error(result.error);

      queryClient.setQueryData<OrganizationData[]>(
        ['organizations'],
        (old = []) => {
          const newOrgs = [...old, result.organization!];
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('organizations', JSON.stringify(newOrgs));
          }
          return newOrgs;
        },
      );

      toast({
        title: 'Organization created successfully',
        description: 'Your new organization has been created',
      });
    } catch (error) {
      toast({
        title: 'Error creating organization',
        description:
          error instanceof Error ? error.message : 'Something went wrong.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateOrg = async (id: string, data: { name: string }) => {
    try {
      const result = await updateOrganization(id, data.name);
      if ('error' in result) throw new Error(result.error);

      queryClient.setQueryData<OrganizationData[]>(
        ['organizations'],
        (old = []) => {
          const newOrgs = old.map((org) =>
            org.id === result.organization!.id ? result.organization! : org,
          );
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('organizations', JSON.stringify(newOrgs));
          }
          return newOrgs;
        },
      );

      queryClient.setQueryData(
        ['organization', result.organization!.id],
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
      if ('error' in result) throw new Error(result.error);

      queryClient.setQueryData<OrganizationData[]>(
        ['organizations'],
        (old = []) => {
          const newOrgs = old?.filter((org) => org.id !== id) ?? [];
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('organizations', JSON.stringify(newOrgs));
          }
          return newOrgs;
        },
      );

      queryClient.removeQueries({ queryKey: ['organization', id] });

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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('organizations');
    }
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
