'use client';

import { CheckIcon } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: 'platform' | 'content' | 'media' | 'publish';
    onStepClick: (step: 'platform' | 'content' | 'media' | 'publish') => void;
    isStepValid: {
        platform: boolean;
        content: boolean;
        media: boolean;
        publish: boolean;
    };
}

export function StepIndicator({
    currentStep,
    onStepClick,
    isStepValid,
}: StepIndicatorProps) {
    const steps = [
        { id: 'platform', label: 'Platform' },
        { id: 'content', label: 'Content' },
        { id: 'media', label: 'Media' },
        { id: 'publish', label: 'Publish' },
    ] as const;

    const getStepIndex = (step: (typeof steps)[number]['id']) => {
        return steps.findIndex((s) => s.id === step);
    };

    const currentStepIndex = getStepIndex(currentStep);

    return (
        <div className="relative">
            <div className="absolute left-0 top-4 h-0.5 w-full bg-muted">
                <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
                    style={{
                        width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                    }}
                />
            </div>

            <ol className="relative z-10 flex justify-between">
                {steps.map((step, index) => {
                    const stepId = step.id as keyof typeof isStepValid;
                    const isActive = currentStep === step.id;
                    const isPreviousStep = getStepIndex(currentStep) > index;
                    const isCompleted = isPreviousStep && isStepValid[stepId];
                    const isClickable =
                        index === 0 || isStepValid[steps[index - 1].id];

                    return (
                        <li
                            key={step.id}
                            className="flex flex-col items-center"
                        >
                            <button
                                type="button"
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : isCompleted
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-muted bg-background'
                                } ${!isClickable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                onClick={() =>
                                    isClickable && onStepClick(step.id)
                                }
                                disabled={!isClickable}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                {isCompleted ? (
                                    <CheckIcon className="h-4 w-4" />
                                ) : (
                                    index + 1
                                )}
                            </button>
                            <span
                                className={`mt-2 text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                                {step.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
