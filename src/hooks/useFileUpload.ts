
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimiter } from './useRateLimiter';
import { useAuditLogger } from './useAuditLogger';

export const useFileUpload = () => {
  const { user } = useAuth();
  const { checkRateLimit } = useRateLimiter();
  const { logFileUpload, logFailure } = useAuditLogger();
  const [uploading, setUploading] = useState(false);

  // Enhanced file validation constants
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

  // Suspicious file patterns for basic virus/malware detection
  const SUSPICIOUS_PATTERNS = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.com$/i, /\.pif$/i,
    /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.app$/i, /\.deb$/i, /\.dmg$/i,
    /\.iso$/i, /\.msi$/i, /\.pkg$/i, /\.rpm$/i
  ];

  // Magic number validation for enhanced security beyond MIME type
  const MAGIC_NUMBERS = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  };

  // Enhanced magic number validation function
  const validateMagicNumbers = async (file: File): Promise<void> => {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const expectedMagic = MAGIC_NUMBERS[file.type as keyof typeof MAGIC_NUMBERS];
    
    if (expectedMagic) {
      for (let i = 0; i < expectedMagic.length; i++) {
        if (bytes[i] !== expectedMagic[i]) {
          throw new Error('File content does not match the declared file type. Possible file spoofing detected.');
        }
      }
    }
  };

  const validateFile = async (file: File): Promise<void> => {
    // Check for suspicious file patterns first
    SUSPICIOUS_PATTERNS.forEach(pattern => {
      if (pattern.test(file.name)) {
        throw new Error('File type not allowed for security reasons.');
      }
    });

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
    }

    // Enhanced security: Validate file content matches declared type
    await validateMagicNumbers(file);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Check file extension as additional security
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      throw new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .pdf files are allowed.');
    }

    // Enhanced filename sanitization to prevent injection
    if (
      file.name.includes('..') || 
      file.name.includes('/') || 
      file.name.includes('\\') ||
      file.name.includes('<') ||
      file.name.includes('>') ||
      file.name.includes('|') ||
      file.name.includes(':') ||
      file.name.includes('*') ||
      file.name.includes('?') ||
      file.name.includes('"') ||
      file.name.length > 255
    ) {
      throw new Error('Invalid filename. Please rename your file using only letters, numbers, hyphens, and dots.');
    }

    // Check for empty file
    if (file.size === 0) {
      throw new Error('File cannot be empty.');
    }

    // Basic check for minimum file size (suspicious if too small for claimed type)
    if (file.type === 'application/pdf' && file.size < 100) {
      throw new Error('PDF file appears to be corrupted or invalid.');
    }

    if (file.type.startsWith('image/') && file.size < 50) {
      throw new Error('Image file appears to be corrupted or invalid.');
    }
  };

  const uploadReceipt = async (file: File, transactionId: string) => {
    if (!user) throw new Error('No user found');
    
    // Check rate limiting first
    const rateLimitPassed = await checkRateLimit('file_upload');
    if (!rateLimitPassed) {
      throw new Error("Upload rate limit exceeded. Please wait before uploading more files.");
    }
    
    // Validate file before upload
    await validateFile(file);
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      // Enhanced filename sanitization to prevent injection attacks
      const baseFileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'file';
      const sanitizedBaseName = baseFileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace unsafe chars with underscore
        .replace(/_{2,}/g, '_')             // Collapse multiple underscores
        .replace(/^[._-]+|[._-]+$/g, '')    // Remove leading/trailing dots, underscores, hyphens
        .substring(0, 100);                 // Limit length
      
      const finalFileName = sanitizedBaseName || 'receipt';
      const fileName = `${user.id}/${transactionId}/${Date.now()}_${finalFileName}.${fileExt}`;
      
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Log successful file upload
      await logFileUpload(file.name, file.type, file.size, transactionId);

      return { publicUrl: urlData.publicUrl, path: fileName };
    } catch (error: any) {
      // Log failed file upload
      await logFailure('file_upload', error.message, {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        transaction_id: transactionId
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadReceipt,
    uploading,
  };
};
