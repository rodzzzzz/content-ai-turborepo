import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

export const LoadingMessage = ({
    message = 'Sending your message...',
}: {
    message?: string;
}) => {
    const role = 'assistant';

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="w-full"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            data-role={role}
        >
            <div className="flex items-center gap-2 overflow-visible">
                <div className="relative">
                    <div className="absolute -inset-0.5 animate-magic-shadow rounded-full bg-magic opacity-50 blur" />

                    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-border before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-magic before:p-[1px]">
                        <SparklesIcon className="h-4 w-4" />
                    </div>
                </div>

                <div className="animate-pulse text-sm">{message}</div>
            </div>
        </motion.div>
    );
};
