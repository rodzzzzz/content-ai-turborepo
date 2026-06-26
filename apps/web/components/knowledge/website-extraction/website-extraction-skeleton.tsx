import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function WebsiteExtractionSkeleton() {
    return (
        <Card className="border-0 lg:border">
            <CardHeader className="p-0 pb-6 lg:p-6">
                <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                <div className="mt-1 h-4 w-80 animate-pulse rounded-md bg-muted" />
            </CardHeader>

            <Separator className="hidden lg:block" />

            <CardContent className="p-0 lg:p-6">
                <div className="flex flex-col gap-2">
                    {/* Domain Input Skeleton */}
                    <div>
                        <div className="mb-1.5 h-4 w-16 animate-pulse rounded bg-muted" />
                        <div className="flex items-center gap-2">
                            <div className="inline-flex w-full border-collapse">
                                <div className="h-10 w-[140px] animate-pulse rounded-l bg-muted" />
                                <div className="h-10 flex-1 animate-pulse rounded-r bg-muted" />
                            </div>
                            <div className="h-10 w-[100px] animate-pulse rounded bg-muted" />
                        </div>
                    </div>

                    {/* Uploaded Links Section Skeleton */}
                    <div className="mt-4 rounded-md border">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex items-center gap-4 py-3">
                                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                            </div>
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 py-4"
                                >
                                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                                    <div className="flex-1">
                                        <div className="mb-1 h-3 w-3/4 animate-pulse rounded bg-muted" />
                                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                                    </div>
                                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                                        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                                        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
