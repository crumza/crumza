import { twMerge } from 'tailwind-merge';

/** clsx, vendored (MIT, Luke Edwards, v2.1.1). tailwind-merge is the one runtime dependency. */
type ClassDictionary = Record<string, unknown>;
type ClassValue = string | number | boolean | null | undefined | ClassValue[] | ClassDictionary;

function toVal(mix: ClassValue): string {
  if (typeof mix === 'string' || typeof mix === 'number') return String(mix);
  if (typeof mix !== 'object' || mix === null) return '';
  let str = '';
  if (Array.isArray(mix)) {
    for (const item of mix) {
      const next = toVal(item);
      if (next) str += (str && ' ') + next;
    }
    return str;
  }
  for (const key in mix) {
    if (mix[key]) str += (str && ' ') + key;
  }
  return str;
}

/** Merge class names; conflicting Tailwind utilities resolve last-wins so `className` overrides stick. */
export function cn(...inputs: ClassValue[]): string {
  let str = '';
  for (const input of inputs) {
    const next = toVal(input);
    if (next) str += (str && ' ') + next;
  }
  return twMerge(str);
}
