'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { WelcomeStep } from './welcome-step';
import { UserInfoStep } from './user-info-step';
import { OrganizationStep } from './organization-step';
import { DiscoveryStep } from './discovery-step';
import { SuccessStep } from './success-step';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CircleCheckIcon,
    Loader2Icon,
} from 'lucide-react';
import { onboarding } from '@/actions/onboarding';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-provider';
import MagicBg from '@/components/magic-bg';
import { useOrganization } from '@/contexts/organization-context';

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
    const [step, setStep] = useState<number | null>(null);
    const { refetch, session } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { invalidateOrganizations } = useOrganization();

    const userTimeZone =
        typeof session?.user?.timeZone === 'string'
            ? session.user.timeZone
            : typeof Intl !== 'undefined'
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : 'America/New_York';

    const methods = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            firstName: session?.user?.name?.split(' ')[0] || '',
            lastName: session?.user?.name?.split(' ')[1] || '',
            timeZone: userTimeZone,
            organizationName: '',
            organizationSize: '',
            organizationType: '',
            discoveryChannel: '',
        },
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
    });

    const { handleSubmit, trigger } = methods;

    const steps = [
        {
            id: 'user-info',
            component: <UserInfoStep control={methods.control} />,
        },
        {
            id: 'organization',
            component: <OrganizationStep control={methods.control} />,
        },
        {
            id: 'discovery',
            component: <DiscoveryStep control={methods.control} />,
        },

        { id: 'success', component: <SuccessStep /> },
    ];

    const totalSteps = steps.length;

    const goToNextStep = async () => {
        const fieldsToValidate = [
            ['firstName', 'lastName', 'timeZone'],
            ['organizationName', 'organizationSize', 'organizationType'],
            ['discoveryChannel'],
            [], // Success step (no validation)
        ];

        // Only validate fields for the current step
        const currentStepFields = fieldsToValidate[step ?? 0];
        const isStepValid = await trigger(
            currentStepFields as (keyof OnboardingFormData)[],
        );

        if (step !== null && isStepValid) {
            if (step < totalSteps - 1) {
                setStep(step + 1);
            }
        }
    };

    const goToPreviousStep = () => {
        if (step !== null && step > 0) {
            setStep(step - 1);
        }
    };

    const onSubmit = async (values: OnboardingFormData) => {
        startTransition(async () => {
            try {
                const data = await onboarding(values);

                if (data.error) {
                    toast({
                        title: data.error,
                        description:
                            'User onboarding was not completed. Please try again.',
                        variant: 'destructive',
                    });
                    return;
                }

                if (data.success) {
                    // Refetch session so client has fresh data (organizationId, isOnboardingCompleted)
                    // Backend customSession fetches from DB; refetch picks up the new values
                    await refetch();

                    // Invalidate organizations query cache and clear sessionStorage
                    // to ensure fresh data is fetched after redirect
                    invalidateOrganizations();
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('organizations');
                    }

                    setStep(totalSteps - 1);
                }
            } catch (error) {
                console.error(error);

                toast({
                    title: 'Something went wrong.',
                    description:
                        'User onboarding was not completed. Please try again.',
                    variant: 'destructive',
                });
            }
        });
    };

    const variants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
            <MagicBg />

            <div className="relative z-10 w-full max-w-md">
                {/* Step indicator (hide on welcome and success steps) */}
                {step !== null && step !== totalSteps - 1 && (
                    <div className="mb-6 flex justify-center">
                        <div className="flex items-center space-x-2 rounded-full bg-white bg-opacity-80 px-6 py-2 shadow-md backdrop-blur-sm">
                            {[...Array(totalSteps - 1)].map((_, index) => {
                                return (
                                    <motion.div
                                        key={index}
                                        className={`h-2 w-2 rounded-full ${index < step
                                            ? 'bg-primary'
                                            : index === step
                                                ? 'bg-primary'
                                                : 'bg-gray-300'
                                            }`}
                                        initial={false}
                                        animate={{
                                            scale: index === step ? 1.3 : 1,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 30,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === null ? (
                    <WelcomeStep setStep={setStep} />
                ) : (
                    <Card className="overflow-hidden rounded-3xl border-0 bg-white bg-opacity-80 shadow-2xl backdrop-blur-sm">
                        <CardContent className="p-0">
                            <Form {...methods}>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="p-8"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            variants={variants}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            className="flex min-h-[450px] flex-col"
                                        >
                                            {steps[step]?.component}
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className="mt-auto flex justify-between pt-6">
                                        {step > 0 && step < totalSteps - 1 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={goToPreviousStep}
                                            >
                                                <ArrowLeftIcon className="h-4 w-4" />
                                                Back
                                            </Button>
                                        ) : (
                                            <div></div>
                                        )}

                                        {step < totalSteps - 2 ? (
                                            <Button
                                                type="button"
                                                onClick={goToNextStep}
                                            >
                                                Continue
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Button>
                                        ) : null}

                                        {step === totalSteps - 2 ? (
                                            <Button
                                                type="submit"
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CircleCheckIcon className="h-4 w-4" />
                                                )}

                                                {isPending
                                                    ? 'Submitting...'
                                                    : 'Complete'}
                                            </Button>
                                        ) : null}
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
