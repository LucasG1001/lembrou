const MAX_DIMENSION = 1280;
const MAX_DATA_URL_LENGTH = 280000;
const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5];

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let dataUrl = "";
  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) break;
  }
  return dataUrl;
}
