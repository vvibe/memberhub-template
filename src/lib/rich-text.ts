import DOMPurify from 'dompurify'

const blockTagPattern = /<\/?(p|h2|h3|ul|ol|li|blockquote|strong|em|s|code|pre|br|img|video|iframe)\b/i

const allowedTags = ['p', 'br', 'strong', 'em', 's', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'code', 'pre', 'img', 'video', 'iframe']
const allowedAttrs = ['src', 'alt', 'title', 'controls', 'loading', 'allow', 'allowfullscreen', 'class']

export function hasRichTextMarkup(value: string) {
  return blockTagPattern.test(value)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function textToEditorHtml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return ''

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')
}

export function normalizeEditorHtml(value: string) {
  return hasRichTextMarkup(value) ? value : textToEditorHtml(value)
}

export function sanitizeRichTextHtml(value: string) {
  const html = normalizeEditorHtml(value)
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
  })
}

export function richTextBlocks(value: string) {
  const html = sanitizeRichTextHtml(value)
  const blocks = html.match(/<(p|h2|h3|ul|ol|blockquote|pre)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi)
  return blocks && blocks.length > 0 ? blocks : html ? [`<p>${html}</p>`] : []
}

export function richTextPlainText(value: string) {
  if (!hasRichTextMarkup(value)) return value

  if (typeof document === 'undefined') {
    return value.replace(/<[^>]+>/g, ' ')
  }

  const element = document.createElement('div')
  element.innerHTML = sanitizeRichTextHtml(value)
  return element.textContent ?? ''
}
