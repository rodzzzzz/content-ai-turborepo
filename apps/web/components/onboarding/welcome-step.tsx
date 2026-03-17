'use client';

import { motion } from 'framer-motion';
import { MagicButton } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';

export function WelcomeStep({ setStep }: { setStep: (step: number) => void }) {
    return (
        <div className="flex flex-1 flex-col items-center space-y-8">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h1
                    className="mb-3 text-3xl font-bold tracking-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    Welcome to Content AI!
                </motion.h1>

                <motion.p
                    className="mx-auto max-w-md text-lg text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    We&apos;re excited to have you join us. Let&apos;s get your
                    account set up in just a few easy steps.
                </motion.p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                <MagicButton
                    variant="primary"
                    shadowVariant="animated"
                    type="button"
                    onClick={() => setStep(0)}
                >
                    Get Started
                    <ArrowRightIcon className="h-4 w-4" />
                </MagicButton>
            </motion.div>
        </div>
    );
}
