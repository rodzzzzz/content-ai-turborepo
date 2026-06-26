import GeneralSettingsForm from '@/components/general-settings/general-settings-form';
import PasswordResetForm from '@/components/general-settings/password-reset-form';
import DashboardShell from '@/components/dashboard-shell';
export default function GeneralSettings() {
    return (
        <DashboardShell
            title="General Settings"
            description="Manage your general settings"
        >
            <div className="flex w-full max-w-3xl flex-col gap-4">
                <GeneralSettingsForm />
                {/* <NotificationSettingsForm /> */}
                <PasswordResetForm />
            </div>
        </DashboardShell>
    );
}
