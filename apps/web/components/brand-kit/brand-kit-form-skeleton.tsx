import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function BrandKitFormSkeleton() {
    return (
        <Card className="border-0 lg:border">
            <CardHeader className="p-0 pb-6 lg:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-40" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
            </CardHeader>

            <Separator className="hidden lg:block" />

            <CardContent className="space-y-8 p-0 lg:p-6">
                {/* Font Section */}
                <div>
                    <Skeleton className="mb-4 h-5 w-12" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full sm:h-32" />
                        ))}
                    </div>
                </div>

                {/* Primary Color Section */}
                <div>
                    <Skeleton className="mb-4 h-5 w-32" />
                    <Skeleton className="min-h-[140px] w-full rounded-lg" />
                </div>

                {/* Additional Colors Section */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Skeleton className="min-h-[140px] w-full rounded-lg" />
                </div>

                {/* Logo Section */}
                <div>
                    <Skeleton className="mb-4 h-5 w-16" />
                    <Skeleton className="min-h-[160px] w-full rounded-lg" />
                </div>

                {/* Icon Section */}
                <div>
                    <Skeleton className="mb-4 h-5 w-16" />
                    <Skeleton className="min-h-[160px] w-full rounded-lg" />
                </div>
            </CardContent>
        </Card>
    );
}
