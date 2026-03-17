import { currentUser } from '@/lib/auth';
import { DEFAULT_LOGOUT_REDIRECT } from '@/lib/routes';
import { redirect } from 'next/navigation';
import Onboarding from '@/components/onboarding/onboarding';
export default async function OnboardPage() {
    const user = await currentUser();

    if (!user) {
        redirect(DEFAULT_LOGOUT_REDIRECT || '/login');
    }

    return <Onboarding />;
}
