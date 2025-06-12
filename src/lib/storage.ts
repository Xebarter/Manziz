import { supabase } from './supabase';

export class StorageService {
  private static BUCKET_NAME = 'menu-images';

  static async uploadImage(file: File): Promise<{ url: string; error?: string }> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { url: '', error: 'Please upload a valid image file (JPEG, PNG, or WebP)' };
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { url: '', error: 'Image size must be less than 5MB' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { url: '', error: 'Failed to upload image. Please try again.' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (error) {
      console.error('Storage service error:', error);
      return { url: '', error: 'An unexpected error occurred during upload' };
    }
  }

  static async deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        return { success: false, error: 'Invalid image URL' };
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Failed to delete image' };
      }

      return { success: true };
    } catch (error) {
      console.error('Storage service error:', error);
      return { success: false, error: 'An unexpected error occurred during deletion' };
    }
  }
}