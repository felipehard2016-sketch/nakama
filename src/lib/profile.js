import { supabase } from './supabase';

const BUCKET = 'profiles';

/* Converte arquivo para webp-like via canvas para reduzir tamanho */
async function resizeImage(file, maxPx = 800) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.88);
    };
    img.src = url;
  });
}

/* Upload do avatar — retorna URL pública */
export async function uploadAvatar(userId, file) {
  const blob = await resizeImage(file, 400);
  const path = `avatars/${userId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true, contentType: 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  /* Força quebra de cache adicionando timestamp */
  return `${data.publicUrl}?t=${Date.now()}`;
}

/* Upload do banner — retorna URL pública */
export async function uploadBanner(userId, file) {
  const blob = await resizeImage(file, 1200);
  const path = `banners/${userId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true, contentType: 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/* Persiste URLs no metadata do usuário */
export async function saveProfileMeta(updates) {
  const { error } = await supabase.auth.updateUser({ data: updates });
  if (error) throw error;
}
