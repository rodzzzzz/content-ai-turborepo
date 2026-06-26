/**
 * Map font family names to font categories
 */
export function mapFontToCategory(fontFamily: string): string | undefined {
    const lowerFont = fontFamily.toLowerCase();

    // Serif fonts
    if (
        lowerFont.includes('serif') ||
        lowerFont.includes('times') ||
        lowerFont.includes('georgia') ||
        lowerFont.includes('garamond') ||
        lowerFont.includes('baskerville') ||
        lowerFont.includes('palatino')
    ) {
        return 'Serif';
    }

    // Sans-serif fonts
    if (
        lowerFont.includes('sans') ||
        lowerFont.includes('arial') ||
        lowerFont.includes('helvetica') ||
        lowerFont.includes('inter') ||
        lowerFont.includes('roboto') ||
        lowerFont.includes('open sans') ||
        lowerFont.includes('lato') ||
        lowerFont.includes('montserrat') ||
        lowerFont.includes('poppins')
    ) {
        return 'Sans Serif';
    }

    // Monospace fonts
    if (
        lowerFont.includes('mono') ||
        lowerFont.includes('courier') ||
        lowerFont.includes('consolas') ||
        lowerFont.includes('menlo') ||
        lowerFont.includes('source code')
    ) {
        return 'Monospace';
    }

    // Cursive fonts
    if (
        lowerFont.includes('cursive') ||
        lowerFont.includes('script') ||
        lowerFont.includes('brush') ||
        lowerFont.includes('handwriting')
    ) {
        return 'Cursive';
    }

    // Default to sans-serif if no match
    return 'Sans Serif';
}

// Font family mapping for preview
export function getFontFamily(category: string): string {
    switch (category) {
        case 'Serif':
            return 'Georgia, "Times New Roman", serif';
        case 'Sans Serif':
            return '"Helvetica Neue", Arial, sans-serif';
        case 'Monospace':
            return '"Courier New", Courier, monospace';
        case 'Cursive':
            return '"Brush Script MT", cursive';
        default:
            return 'Sans Serif';
    }
}
