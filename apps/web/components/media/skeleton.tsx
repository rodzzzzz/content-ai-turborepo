function FolderSkeleton() {
    return (
        <div className="relative rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                </div>
                <div className="w-full min-w-0 flex-1 space-y-1">
                    <div className="h-[18px] w-28 max-w-full animate-pulse rounded bg-muted"></div>
                    <div className="h-3 w-16 max-w-full animate-pulse rounded bg-muted"></div>
                </div>
            </div>
        </div>
    );
}

export { FolderSkeleton };
