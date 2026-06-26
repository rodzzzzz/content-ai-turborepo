import React from 'react';

const DashboardShell = ({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) => {
    return (
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
            <div className="relative overflow-hidden p-4">
                <div className="relative z-10 py-4 lg:py-12">
                    <h1 className="text-lg font-semibold tracking-tight lg:text-2xl">
                        {title}
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
};

export default DashboardShell;
