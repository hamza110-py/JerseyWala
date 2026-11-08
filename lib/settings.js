import { createPublicClient, isSupabaseConfigured } from '@/lib/supabase/public';

export const DEFAULT_ABOUT =
  'Jersey Wala was started by football fans, for football fans. We believe a jersey is more than fabric. It is the club you grew up supporting, the night you will never forget and the identity you carry into every match.\n\nWe bring you your favourite club and national team jerseys, delivered across Pakistan, and we keep ordering simple: just message us on Instagram, tell us what you want, and we take care of the rest.\n\nWear Your Passion.';

export const DEFAULT_SETTINGS = {
  instagram_username: process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'jers10ywala',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  slogan: 'Wear Your Passion.',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  about_text: '',
  hero_image_url: '',
};

export async function getSettings() {
  if (!isSupabaseConfigured()) return { ...DEFAULT_SETTINGS };
  try {
    const sb = createPublicClient();
    const { data } = await sb.from('store_settings').select('*').eq('id', 1).maybeSingle();
    const merged = { ...DEFAULT_SETTINGS };
    if (data) {
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          merged[key] = data[key];
        }
      });
    }
    return merged;
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}
