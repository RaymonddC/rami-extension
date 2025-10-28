/**
 * Convert Markdown to HTML
 * Supports: bullet points (*), bold (**), italic (*), and line breaks
 */
export function convertMarkdownToHTML(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Convert bullet points (* text) to list items
  const bulletLines = html.split(/\n/).map(line => line.trim()).filter(line => line);
  const hasBullets = bulletLines.some(line => line.startsWith('* '));

  if (hasBullets) {
    const listItems = bulletLines
      .map(line => {
        if (line.startsWith('* ')) {
          return `<li>${line.substring(2).trim()}</li>`;
        }
        return line;
      })
      .join('');
    html = `<ul>${listItems}</ul>`;
  }

  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert line breaks (if not already in list)
  if (!hasBullets) {
    html = html.replace(/\n/g, '<br>');
  }

  return html;
}
