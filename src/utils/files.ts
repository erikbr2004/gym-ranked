/** Extensão da imagem a partir do URI (câmera e galeria podem devolver jpg, png, heic ou webp). */
export function getImageExtension(uri: string): string {
  const match = /\.(jpe?g|png|heic|webp)(?:\?.*)?$/i.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}
