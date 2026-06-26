/**
 * LinkedIn Little Text Format (LTF) content formatter
 *
 * LinkedIn API returns content in LTF format with escaped characters and special syntax.
 * This utility formats the content for proper display to users.
 */

/**
 * Formats LinkedIn content by removing escape characters and processing LTF syntax
 * @param content - Raw LinkedIn content from API
 * @returns Formatted content ready for display
 */
export function formatLinkedInContent(content: string): string {
    if (!content) return '';

    let formatted = content;

    // Step 1: Remove escape characters (backslashes before special characters)
    // This handles cases like: \[TEST\] -> [TEST], \# -> #
    formatted = formatted.replace(/\\(.)/g, '$1');

    // Step 2: Process hashtag syntax: {hashtag|#|tagname} -> #tagname
    formatted = formatted.replace(/\{hashtag\|#\|([^}]+)\}/g, '#$1');

    // Step 3: Process mention syntax: {mention|@|username} -> @username
    formatted = formatted.replace(/\{mention\|@\|([^}]+)\}/g, '@$1');

    // Step 4: Process bold formatting: **text** -> **text** (keep as is for now)
    // LinkedIn uses ** for bold, we can keep this for display or convert to HTML
    // For now, we'll keep the ** syntax as it's readable

    // Step 5: Process italic formatting: _text_ -> _text_ (keep as is for now)
    // LinkedIn uses _ for italic, we can keep this for display or convert to HTML
    // For now, we'll keep the _ syntax as it's readable

    // Step 6: Process strikethrough formatting: ~~text~~ -> ~~text~~ (keep as is for now)
    // LinkedIn uses ~~ for strikethrough, we can keep this for display or convert to HTML
    // For now, we'll keep the ~~ syntax as it's readable

    return formatted;
}

/**
 * Formats LinkedIn content and converts LTF formatting to HTML
 * @param content - Raw LinkedIn content from API
 * @returns HTML formatted content
 */
export function formatLinkedInContentToHTML(content: string): string {
    if (!content) return '';

    let formatted = content;

    // Step 1: Remove escape characters
    formatted = formatted.replace(/\\(.)/g, '$1');

    // Step 2: Process hashtag syntax: {hashtag|#|tagname} -> <span class="hashtag">#tagname</span>
    formatted = formatted.replace(
        /\{hashtag\|#\|([^}]+)\}/g,
        '<span class="hashtag text-blue-600 font-medium">#$1</span>',
    );

    // Step 3: Process mention syntax: {mention|@|username} -> <span class="mention">@username</span>
    formatted = formatted.replace(
        /\{mention\|@\|([^}]+)\}/g,
        '<span class="mention text-blue-600 font-medium">@$1</span>',
    );

    // Step 4: Process bold formatting: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Step 5: Process italic formatting: _text_ -> <em>text</em>
    formatted = formatted.replace(/\b_(.*?)_\b/g, '<em>$1</em>');

    // Step 6: Process strikethrough formatting: ~~text~~ -> <del>text</del>
    formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Step 7: Convert line breaks to <br> tags
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

/**
 * Extracts hashtags from LinkedIn content
 * @param content - Raw LinkedIn content from API
 * @returns Array of hashtag strings
 */
export function extractLinkedInHashtags(content: string): string[] {
    if (!content) return [];

    const hashtags: string[] = [];

    // Extract from {hashtag|#|tagname} syntax
    const hashtagMatches = content.match(/\{hashtag\|#\|([^}]+)\}/g);
    if (hashtagMatches) {
        hashtagMatches.forEach((match) => {
            const tag = match.replace(/\{hashtag\|#\|([^}]+)\}/, '$1');
            hashtags.push(`#${tag}`);
        });
    }

    // Also extract regular hashtags (after unescaping)
    const unescapedContent = content.replace(/\\(.)/g, '$1');
    const regularHashtags = unescapedContent.match(/#\w+/g);
    if (regularHashtags) {
        hashtags.push(...regularHashtags);
    }

    return [...new Set(hashtags)]; // Remove duplicates
}

/**
 * Extracts mentions from LinkedIn content
 * @param content - Raw LinkedIn content from API
 * @returns Array of mention strings
 */
export function extractLinkedInMentions(content: string): string[] {
    if (!content) return [];

    const mentions: string[] = [];

    // Extract from {mention|@|username} syntax
    const mentionMatches = content.match(/\{mention\|@\|([^}]+)\}/g);
    if (mentionMatches) {
        mentionMatches.forEach((match) => {
            const mention = match.replace(/\{mention\|@\|([^}]+)\}/, '$1');
            mentions.push(`@${mention}`);
        });
    }

    // Also extract regular mentions (after unescaping)
    const unescapedContent = content.replace(/\\(.)/g, '$1');
    const regularMentions = unescapedContent.match(/@\w+/g);
    if (regularMentions) {
        mentions.push(...regularMentions);
    }

    return [...new Set(mentions)]; // Remove duplicates
}
