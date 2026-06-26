'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Subscription } from '@prisma/client';
import { getRecentUsage } from '@/actions/usage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { kFormatter, kebabCaseToWords, formatDollars } from '@/lib/utils';
import { JsonValue } from '@prisma/client/runtime/library';

interface UsageRecord {
    id: string;
    feature: string;
    cost: number;
    timestamp: Date;
    metadata: JsonValue;
}

interface PaginationInfo {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface UsageTableProps {
    subscription: Subscription;
}

export default function UsageTable({ subscription }: UsageTableProps) {
    const { toast } = useToast();
    const [usageData, setUsageData] = useState<{
        records: UsageRecord[];
        pagination: PaginationInfo;
    } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsageData = async (page: number) => {
        try {
            setIsLoading(true);
            const data = await getRecentUsage(subscription.id, page, 10);
            setUsageData(data);
        } catch (error) {
            console.error('Error fetching usage data:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch usage data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsageData(currentPage);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscription.id, currentPage]);

    const handlePreviousPage = () => {
        if (usageData?.pagination.hasPreviousPage) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (usageData?.pagination.hasNextPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getTokenUsage = (metadata: {
        usage: { input?: number; output?: number; tokens?: number };
    }) => {
        if (!metadata) return null;

        // If metadata has specific fields we want to show
        if (typeof metadata === 'object') {
            const entries = Object.entries(metadata);
            if (entries.length === 0) return null;

            // Check for usage object with input/output tokens
            if (metadata.usage && typeof metadata.usage === 'object') {
                if (metadata.usage.tokens) {
                    return { tokens: metadata.usage.tokens };
                }

                if (metadata.usage.input && metadata.usage.output) {
                    const inputTokens = metadata.usage.input;
                    const outputTokens = metadata.usage.output;
                    return { input: inputTokens, output: outputTokens };
                }
            }

            return null;
        }

        return null;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse">
                        <div className="mb-4 h-4 w-32 rounded bg-muted" />
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-10 rounded bg-muted"
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!usageData || usageData.records.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="py-8 text-center text-muted-foreground">
                        No usage records found.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Usage</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/4">
                                    Timestamp
                                </TableHead>
                                <TableHead className="w-1/4">Feature</TableHead>
                                <TableHead className="w-1/4">Tokens</TableHead>

                                <TableHead className="w-1/4">Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usageData.records.map((record) => {
                                const tokenUsage =
                                    getTokenUsage(
                                        record.metadata as {
                                            usage: {
                                                input?: number;
                                                output?: number;
                                                tokens?: number;
                                            };
                                        },
                                    ) ?? null;
                                return (
                                    <TableRow key={record.id}>
                                        <TableCell className="py-4 text-muted-foreground">
                                            {format(
                                                record.timestamp,
                                                "MMM dd 'at' hh:mm a",
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 font-medium">
                                            {kebabCaseToWords(record.feature)}
                                        </TableCell>
                                        <TableCell className="py-4 text-muted-foreground">
                                            {tokenUsage &&
                                            tokenUsage.input &&
                                            tokenUsage.output ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        {kFormatter(
                                                            tokenUsage.input,
                                                        )}
                                                    </span>
                                                    <ArrowRightIcon className="h-3 w-3" />
                                                    <span className="text-muted-foreground">
                                                        {kFormatter(
                                                            tokenUsage.output,
                                                        )}
                                                    </span>
                                                </div>
                                            ) : tokenUsage &&
                                              tokenUsage.tokens ? (
                                                <span className="text-muted-foreground">
                                                    {kFormatter(
                                                        tokenUsage.tokens,
                                                    )}
                                                </span>
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {formatDollars(record.cost)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * 10 + 1} to{' '}
                            {Math.min(
                                currentPage * 10,
                                usageData.pagination.totalCount,
                            )}{' '}
                            of {usageData.pagination.totalCount} records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={!usageData.pagination.hasPreviousPage}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of{' '}
                                {usageData.pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={!usageData.pagination.hasNextPage}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
