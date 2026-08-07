export function getAvatarFallbackFromName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'N/A';
  }

  return trimmed
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function getAvatarFallbackFromEmail(email: string): string {
  return email.trim().charAt(0).toUpperCase() || 'N/A';
}
