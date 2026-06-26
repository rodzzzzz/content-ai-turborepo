import { cn } from '@/lib/utils';

export default function MagicBg({
    className,
}: {
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
}) {
    return (
        <div className={cn('absolute inset-0 overflow-hidden', className)}>
            {/* Top left blob */}
            <div className="animate-blob absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-3xl filter"></div>

            {/* Top right blob */}
            <div className="animate-blob animation-delay-2000 absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-200 opacity-70 mix-blend-multiply blur-3xl filter"></div>

            {/* Bottom left blob */}
            <div className="animate-blob animation-delay-4000 absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-pink-200 opacity-70 mix-blend-multiply blur-3xl filter"></div>

            {/* Bottom right blob */}
            <div className="animate-blob absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-3xl filter"></div>

            {/* Grid pattern overlay */}
            <div className="bg-grid-pattern absolute inset-0 opacity-10"></div>
        </div>
    );
}
