export function isImage(url: string | null | undefined): boolean {
  return !!url && /\.(jpg|jpeg|png|gif)$/i.test(url);
}

export function isVideo(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|avi)$/i.test(url);
}
