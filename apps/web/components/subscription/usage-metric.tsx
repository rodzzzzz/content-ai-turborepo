import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface UsageMetricProps {
    title: string;
    used: number;
    total: number;
    unit: string;
    information?: string;
}

export default function UsageMetric({
    title,
    used,
    total,
    unit,
    information,
}: UsageMetricProps) {
    const percentage = Math.round((used / total) * 100);

    return (
        <div>
            <div className="flex items-center gap-1">
                <h3 className="text-sm font-medium">{title}</h3>
                {!!information && (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs text-sm">{information}</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                <span className="ml-auto text-sm text-muted-foreground">
                    {percentage}%
                </span>
            </div>
            <div className="mt-2">
                <div className="mb-1 h-2 w-full rounded-full bg-muted">
                    <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {typeof used === 'number' && used % 1 === 0
                        ? used.toLocaleString()
                        : used}{' '}
                    /{' '}
                    {typeof total === 'number' && total % 1 === 0
                        ? total.toLocaleString()
                        : total}{' '}
                    {unit}
                </div>
            </div>
        </div>
    );
}
