export function isValidMediaType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/avi'];
  return allowedTypes.includes(file.type);
}

export function isValidMediaSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}


export function isImage(url: string | null | undefined): boolean {
  return !!url && /\.(jpg|jpeg|png|gif)$/i.test(url);
}

export function isVideo(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|avi)$/i.test(url);
}
