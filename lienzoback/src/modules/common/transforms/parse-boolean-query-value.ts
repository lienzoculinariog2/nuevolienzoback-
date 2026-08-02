import type { TransformFnParams } from 'class-transformer';

export function parseBooleanQueryValue({ obj, key }: TransformFnParams): unknown {
  const value = (obj as Record<string, unknown>)[key];

  if (value === 'true') return true;
  if (value === 'false') return false;

  return value;
}
