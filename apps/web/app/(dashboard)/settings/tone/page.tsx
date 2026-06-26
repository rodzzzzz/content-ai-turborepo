import PersonalityBuilder from '@/components/tone/personality-builder';
import PersonalityPreview from '@/components/tone/personality-preview';
import DashboardShell from '@/components/dashboard-shell';

export default function Tone() {
    return (
        <DashboardShell
            title="Tone & Personality"
            description="Manage your your bot's tone and personality"
        >
            <div className="h-full w-full">
                <div className="flex flex-col gap-6">
                    <PersonalityBuilder />
                    <PersonalityPreview />
                </div>
            </div>
        </DashboardShell>
    );
}
