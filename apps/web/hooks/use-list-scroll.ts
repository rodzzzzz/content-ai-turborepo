import { useEffect, useState } from 'react';

type ChatScrollProps = {
    shouldLoadMore: boolean;
    loadMore: () => void;
};

export const useListScroll = ({
    shouldLoadMore,
    loadMore,
}: ChatScrollProps) => {
    useEffect(() => {
        const handleScroll = () => {
            const offsetHeight = document.documentElement.offsetHeight;
            const innerHeight = window.innerHeight;
            const scrollTop = document.documentElement.scrollTop;

            const hasReachedBottom =
                offsetHeight - (innerHeight + scrollTop) <= 10;

            if (hasReachedBottom && shouldLoadMore) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [shouldLoadMore, loadMore]);
};
