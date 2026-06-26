import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Badge, MagicBadge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ToolResult } from './tool-result';
import { cn, snakeCaseToWords } from '@/lib/utils';

interface ToolCallAccordionProps {
    toolName: string;
    result: unknown;
    isRunning: boolean;
}

/**
 * Expandable/collapsible tool call result card for assistant tool invocations.
 * Collapsed by default. Expands to show ToolResult when toggled.
 */
export const ToolCallAccordion = ({
    toolName,
    result,
    isRunning,
}: ToolCallAccordionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            layout
            className="mt-3 flex max-w-xl flex-col overflow-hidden rounded-lg border bg-card shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`tool-result-${toolName}`}
                onClick={() => setIsOpen((open) => !open)}
                disabled={isRunning}
                className="flex w-full items-center gap-2 p-4 text-left"
            >
                {isRunning ? (
                    <MagicBadge variant="animated">Running Tool</MagicBadge>
                ) : (
                    <Badge variant="outline">Tool Result</Badge>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                    {snakeCaseToWords(toolName)}
                </span>
                {isRunning ? (
                    <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                    <ChevronRight
                        className={cn(
                            'ml-auto h-4 w-4 transition-transform',
                            isOpen && 'rotate-90',
                        )}
                    />
                )}
            </button>
            <AnimatePresence initial={false}>
                {isOpen && !isRunning && (
                    <motion.div
                        id={`tool-result-${toolName}`}
                        key="result"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <Separator />
                        <div className="p-4">
                            <ToolResult
                                toolName={toolName}
                                result={result}
                                isRunning={isRunning}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
