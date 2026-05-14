type ClassValue = string | number | null | false | undefined | Record<string, boolean>

export function cn(...inputs: ClassValue[]) {
  return inputs
    .flatMap((input) => {
      if (!input) return []
      if (typeof input === 'string' || typeof input === 'number') return [String(input)]
      return Object.entries(input)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
    })
    .join(' ')
}
