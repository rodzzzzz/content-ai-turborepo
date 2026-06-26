export interface SetupStep {
    id: 'integrations' | 'personality' | 'companyInfo';
    label: string;
    completed: boolean;
    route: string;
}

export interface SetupStatus {
    steps: SetupStep[];
    completedCount: number;
    totalSteps: number;
    progressPercentage: number;
    isComplete: boolean;
}
