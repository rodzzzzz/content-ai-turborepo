import WebsiteExtraction from '@/components/knowledge/website-extraction/website-extraction';
import FAQ from '@/components/knowledge/faq';
import DashboardShell from '@/components/dashboard-shell';

export default function Knowledge() {
    return (
        <DashboardShell
            title="Knowledge Base"
            description="Manage your knowledge base and train the bot with company information"
        >
            <div className="h-full w-full">
                <div className="flex flex-col gap-6">
                    <WebsiteExtraction />
                    <FAQ />
                </div>
            </div>
        </DashboardShell>
    );
}
