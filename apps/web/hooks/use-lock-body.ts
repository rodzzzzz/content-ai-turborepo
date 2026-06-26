import * as React from 'react';

// @see https://usehooks.com/useLockBodyScroll.
export function useLockBody() {
    React.useLayoutEffect((): (() => void) => {
        const originalBodyStyle: string = window.getComputedStyle(
            document.body,
        ).overflow;
        const orginalHTMLStyle: string = window.getComputedStyle(
            document.documentElement,
        ).scrollbarGutter;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.scrollbarGutter = 'stable';
        return () => {
            document.body.style.overflow = originalBodyStyle;
            document.documentElement.style.scrollbarGutter = orginalHTMLStyle;
        };
    }, []);
}
