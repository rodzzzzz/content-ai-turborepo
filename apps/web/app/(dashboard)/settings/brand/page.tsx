import { BrandKitManager } from '@/components/brand-kit/brand-kit-manager';
import DashboardShell from '@/components/dashboard-shell';

export default function BrandKitPage() {
    return (
        <DashboardShell
            title="Brand Kit"
            description="Manage your organization's brand identity, colors, fonts, and design system"
        >
            <div className="h-full w-full">
                <BrandKitManager />
            </div>
        </DashboardShell>
    );
}
