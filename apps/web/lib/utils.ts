import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getInitials = (fullName: string) => {
    const allNames = fullName.trim().split(' ');
    const initials = allNames.reduce((acc, curr, index) => {
        if (index === 0 || index === allNames.length - 1) {
            acc = `${acc}${curr.charAt(0).toUpperCase()}`;
        }
        return acc;
    }, '');

    return initials;
};

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getDiscreteFileType = (fileType: string) => {
    return fileType.split('/')[0];
};

export const snakeCaseToWords = (str: string) => {
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const kebabCaseToWords = (str: string) => {
    return str
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const camelCaseToWords = (
    str: string,
    preserveExactWords: string[] = [],
) => {
    if (preserveExactWords.length === 0) {
        // Original behavior when no preserve words
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
            return str.toUpperCase();
        });
    }

    // Sort preserve words by length (longest first) to handle overlapping matches
    const sortedPreserveWords = [...preserveExactWords].sort(
        (a, b) => b.length - a.length,
    );

    // Build a regex pattern that matches any of the preserve words (case insensitive)
    const preservePattern = sortedPreserveWords
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
        .join('|');

    const preserveRegex = new RegExp(`(${preservePattern})`, 'gi');

    // Split the string by preserve words while keeping the matches
    const parts = str.split(preserveRegex);

    // Process each part
    const processedParts = parts.map((part) => {
        // Skip empty parts
        if (!part) {
            return part;
        }

        // If this part matches a preserve word (case insensitive), use the exact case from preserveExactWords
        const matchingPreserveWord = sortedPreserveWords.find(
            (word) => word.toLowerCase() === part.toLowerCase(),
        );

        if (matchingPreserveWord) {
            return matchingPreserveWord;
        }

        // Otherwise, apply camelCase transformation
        return part.replace(/([A-Z])/g, ' $1');
    });

    // Join the parts and clean up extra spaces
    let result = processedParts.join(' ');
    result = result.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    result = result.trim(); // Remove leading and trailing spaces
    result = result.replace(/^./, function (str) {
        return str.toUpperCase();
    });

    return result;
};

export const kFormatter = (num: number) => {
    if (num > 999) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    if (num > 99999) {
        return `${(num / 100000).toFixed(1)}M`;
    }
    return num;
};

export const centsToDollars = (num: number) => {
    const dollars = num / 100;
    if (dollars < 0) {
        return `-$${Math.abs(dollars).toFixed(2)}`;
    }
    return `$${dollars.toFixed(2)}`;
};

export const formatDollars = (num: number) => {
    if (num < 0) {
        return `-$${Math.abs(num).toFixed(2)}`;
    }
    return `$${num.toFixed(2)}`;
};
