import DashboardShell from '@/components/dashboard-shell';
import SubscriptionManager from '@/components/subscription/subscription-manager';
import { currentUser } from '@/lib/auth';
import CreditBalanceManager from '@/components/subscription/credit-balance-manager';
import UsageTable from '@/components/subscription/usage-table';
import { getSubscriptionPageData } from '@/actions/subscription';
import type { Subscription } from '@prisma/client';

export default async function SubscriptionPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const data = await getSubscriptionPageData();

  if (!data || 'error' in data) {
    return null;
  }

  if (!data.subscription) {
    return null;
  }

  const subscription = data.subscription as Subscription;

  const scheduleInfo = data.scheduleInfo
    ? {
        downgradeDate: data.scheduleInfo.downgradeDate
          ? new Date(data.scheduleInfo.downgradeDate as string)
          : null,
        targetPlanName: data.scheduleInfo.targetPlanName,
      }
    : null;

  return (
    <DashboardShell
      title="Subscription and Usage"
      description="Manage your subscription and monitor your resource usage"
    >
      <div className="flex w-full flex-col gap-6">
        <SubscriptionManager
          userTimeZone={data.userTimeZone}
          subscription={subscription}
          plans={data.plans as never}
          currentPlanPriceId={data.currentPlanPriceId}
          scheduleInfo={scheduleInfo}
        />
        <CreditBalanceManager subscription={subscription} />
        <UsageTable subscription={subscription} />
      </div>
    </DashboardShell>
  );
}
