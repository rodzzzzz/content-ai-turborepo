import { XCircleIcon, ListTodoIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { DiffRegistry } from '@/types/campaign-update';
import { LoadingMessage } from './loading-message';

interface CampaignUpdateIndicatorProps {
    toolName: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    output?: DiffRegistry;
    errorText?: string;
}

export function CampaignUpdateIndicator({
    toolName,
    state,
    output,
    errorText,
}: CampaignUpdateIndicatorProps) {
    const getToolLabel = () => {
        switch (toolName) {
            case 'add_content_ideas':
                return 'Adding content ideas';
            case 'delete_content_ideas':
                return 'Deleting content ideas';
            default:
                return 'Updating campaign plan';
        }
    };

    const getOperationCount = () => {
        if (!output) return 0;
        return output.length;
    };

    switch (state) {
        case 'input-streaming':
        case 'input-available':
            return (
                <div
                    className="py-4"
                >
                    <LoadingMessage message={`${getToolLabel()}...`} />
                </div>
            );

        case 'output-available':
            const count = getOperationCount();
            return (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
                >
                    <ListTodoIcon className="h-4 w-4 flex-shrink-0 stroke-2" />
                    <p>
                        {`${getToolLabel()} done: ${count} pending change${count !== 1 ? 's' : ''} added to the campaign plan`}
                    </p>
                </motion.div>
            );

        case 'output-error':
            return (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 py-3 text-sm text-destructive"
                >
                    <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                    <span>
                        Failed to {getToolLabel().toLowerCase()}:{' '}
                        {errorText || 'Unknown error'}
                    </span>
                </motion.div>
            );

        default:
            return null;
    }
}
