'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';

import { useConfetti } from '@/hooks/use-confetti';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export function SuccessStep() {
    const { fireConfetti } = useConfetti();
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Small delay to ensure the component is fully rendered
        const timer = setTimeout(() => {
            fireConfetti();
        }, 300);

        return () => clearTimeout(timer);
    }, [fireConfetti]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Handle navigation when countdown reaches 0
    useEffect(() => {
        if (countdown === 0) {
            // Use setTimeout to defer navigation and avoid updating Router during render
            const navigateTimer = setTimeout(() => {
                router.push(DEFAULT_LOGIN_REDIRECT);
            }, 0);

            return () => clearTimeout(navigateTimer);
        }
    }, [countdown, router]);

    const handleManualRedirect = () => {
        router.push(DEFAULT_LOGIN_REDIRECT);
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-8 text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2,
                }}
                className="relative"
            >
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-green-100 to-blue-100 shadow-lg">
                    <CheckIcon className="h-14 w-14 text-green-600" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
            >
                <h2 className="text-3xl font-bold tracking-tight">
                    You&apos;re all set!
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
                    Thank you for completing your profile. Your account is now
                    ready to use.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-4 pt-6"
            >
                <div className="rounded-full bg-linear-to-r from-green-100 to-blue-100 px-6 py-3">
                    <p className="text-sm font-medium text-green-600">
                        Redirecting to dashboard in {countdown} seconds...
                    </p>
                </div>
                <Button
                    variant="link"
                    onClick={handleManualRedirect}
                    className="h-fit p-0 text-xs text-muted-foreground"
                >
                    Click here if you did not get redirected
                </Button>
            </motion.div>
        </div>
    );
}
