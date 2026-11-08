// Shrinks big phone photos before upload so the shop loads fast.
// Falls back to the original file if the browser cannot process it.
export async function prepareImage(file, maxSize = 1600) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (blob) return { blob, type: 'image/jpeg', ext: 'jpg' };
  } catch (e) {
    // ignore and use the original
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, type: file.type || 'image/jpeg', ext };
}
