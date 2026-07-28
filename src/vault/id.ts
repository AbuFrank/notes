let counter = 0;

export function generateId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
