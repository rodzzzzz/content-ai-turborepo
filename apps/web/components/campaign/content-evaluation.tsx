import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { ChevronDown } from 'lucide-react';
import { isEmpty } from 'lodash';
import { Response } from '@/components/ai-elements/response';
import { PolarRadiusAxis } from 'recharts';
import { RadialBar } from 'recharts';
import { ChartConfig, ChartContainer } from '../ui/chart';
import { PolarGrid } from 'recharts';
import { RadialBarChart } from 'recharts';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export type ContentEvaluationType = {
    qualityScore: number;
    improvements: string[];
    reasoningText: string;
};

export function ContentEvaluation({
    evaluation,
    className,
    ...props
}: {
    evaluation: ContentEvaluationType;
} & React.HTMLAttributes<HTMLDivElement>) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn('flex flex-col gap-2', className)} {...props}>
            <QualityScoreChart score={evaluation.qualityScore} />
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <Response>{evaluation.reasoningText}</Response>
            </div>
            {!isEmpty(evaluation.improvements) && (
                <Collapsible
                    className="flex flex-col gap-2 rounded-lg border border-border p-4 text-sm"
                    onOpenChange={(open) => setIsOpen(open)}
                >
                    <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
                        Improvements
                        <Badge variant="outline">
                            {evaluation.improvements.length}
                        </Badge>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-auto h-4 w-4"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </motion.div>
                    </CollapsibleTrigger>

                    <AnimatePresence>
                        <CollapsibleContent asChild>
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <ul className="mt-2 flex list-inside flex-col items-start gap-2 text-muted-foreground">
                                    {evaluation.improvements.map(
                                        (improvement) => (
                                            <motion.li
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="rounded-md bg-muted p-2"
                                                key={improvement}
                                            >
                                                {improvement}
                                            </motion.li>
                                        ),
                                    )}
                                </ul>
                            </motion.div>
                        </CollapsibleContent>
                    </AnimatePresence>
                </Collapsible>
            )}
        </div>
    );
}

const QualityScoreChart = ({ score }: { score: number }) => {
    const chartData = [
        {
            name: 'Quality Score',
            value: score,
            maxValue: 100,
            fill: 'hsl(var(--primary))',
        },
    ];

    const chartConfig = {
        quality: {
            label: 'Quality Score',
            color: 'hsl(var(--primary))',
        },
    } satisfies ChartConfig;

    return (
        <div className="flex items-center gap-4 p-4 pt-2">
            <ChartContainer
                config={chartConfig}
                className="aspect-square h-[70px] w-[70px]"
            >
                <RadialBarChart
                    data={chartData}
                    startAngle={0}
                    endAngle={(score / 100) * 360}
                    innerRadius={30}
                    outerRadius={50}
                >
                    <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[35, 25]}
                    />
                    <RadialBar
                        dataKey="value"
                        background
                        cornerRadius={5}
                        fill="hsl(var(--primary))"
                        // isAnimationActive={false}
                    />
                    <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                    />
                </RadialBarChart>
            </ChartContainer>

            <div className="flex flex-col">
                <h3 className="text-4xl font-bold">
                    {score}
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                        / 100
                    </span>
                </h3>
                <p className="text-xs text-muted-foreground">Quality Score</p>
            </div>
        </div>
    );
};
