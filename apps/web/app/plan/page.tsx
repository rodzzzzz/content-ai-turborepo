import { currentUser } from '@/lib/auth';
import MagicBg from '@/components/magic-bg';
import { PlanSelector } from '@/components/subscription/plan-selector';
import { getStripePrices } from '@/lib/subscription';

export default async function PlanPage() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const prices = await getStripePrices();

    const starterMonthlyPrices = prices.find(
        (price) =>
            price.productName === 'Starter' && price.interval === 'month',
    );
    const growthMonthlyPrices = prices.find(
        (price) => price.productName === 'Growth' && price.interval === 'month',
    );
    const proMonthlyPrices = prices.find(
        (price) => price.productName === 'Pro' && price.interval === 'month',
    );

    const plans = [
        {
            name: 'Starter',
            description: 'Perfect for starting out',
            features: ['$20 credits per month', '1 organization'],
            price: {
                monthly: {
                    amount: starterMonthlyPrices?.unitAmount || 2000, // $20 in cents
                    stripePriceId: starterMonthlyPrices?.id || '',
                },
            },
        },
        {
            name: 'Growth',
            description: 'For growing businesses',
            features: ['$50 credits per month', 'Up to 5 organizations'],
            price: {
                monthly: {
                    amount: growthMonthlyPrices?.unitAmount || 5000, // $50 in cents
                    stripePriceId: growthMonthlyPrices?.id || '',
                },
            },
        },
        {
            name: 'Pro',
            description: 'For professionals and growing teams',
            features: ['$80 credits per month', 'Unlimited organizations'],
            price: {
                monthly: {
                    amount: proMonthlyPrices?.unitAmount || 8000, // $80 in cents
                    stripePriceId: proMonthlyPrices?.id || '',
                },
            },
        },
    ];

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4 py-12 md:py-4">
            <MagicBg className="hidden md:block" />

            <div className="relative w-full max-w-5xl">
                <PlanSelector plans={plans} />
            </div>
        </div>
    );
}
