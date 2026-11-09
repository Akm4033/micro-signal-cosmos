/**
 * Calculates estimated reading time from article Markdown or plain text content.
 * Assumes an average adult reading speed of 200 words per minute.
 *
 * @param content - Raw markdown or text string of the article body
 * @returns Formatted reading time string (e.g. "5 min read")
 */
export function calculateReadingTime(content: string | undefined | null): string {
  if (!content || typeof content !== 'string') {
    return '1 min read';
  }

  // Strip code blocks to avoid inflating word count with syntax tokens
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/<[^>]+>/g, '')         // remove HTML tags
    .replace(/[#*_~`>[\]()]/g, '')   // remove markdown markers
    .trim();

  const words = cleanContent.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

