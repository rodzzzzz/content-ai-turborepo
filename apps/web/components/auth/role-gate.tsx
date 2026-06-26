'use client';

import { UserRole } from '@prisma/client';

import { useCurrentRole } from '@/hooks/use-current-role';
import { TriangleAlert } from 'lucide-react';

interface RoleGateProps {
    children: React.ReactNode;
    allowedRole: UserRole[];
}

export const RoleGate = ({ children, allowedRole }: RoleGateProps) => {
    const role = useCurrentRole();

    if (!allowedRole.includes(role!)) {
        return (
            <main className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground">
                <TriangleAlert className="h-12 w-12 md:h-20 md:w-20" />
                <p className="text-center text-sm">
                    You do not have permission to view this content!
                </p>
            </main>
        );
    }

    return <>{children}</>;
};
