import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingDashboard() {
    return (
        <div className="relative flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-end gap-2 bg-background px-4 pt-6 md:px-6">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="ml-2 h-10 w-32" />
            </header>

            <main className="flex-1 space-y-4 p-4 md:p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array(4)
                        .fill(null)
                        .map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="mb-1 h-8 w-20" />
                                    <Skeleton className="h-4 w-32" />
                                </CardContent>
                            </Card>
                        ))}
                </div>

                <div>
                    <div className="mb-4 flex items-center">
                        <Skeleton className="mr-2 h-8 w-32" />
                        <Skeleton className="mr-2 h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <Card className="col-span-2">
                                <CardHeader>
                                    <Skeleton className="mb-2 h-6 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-[300px] w-full" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="mb-2 h-6 w-40" />
                                    <Skeleton className="h-4 w-48" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-[300px] w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
