import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useReceiptViewer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateSignedUrl = async (transactionId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to view receipts.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt-url', {
        body: { transactionId }
      });

      if (error) {
        console.error('Error generating signed URL:', error);
        toast({
          title: "Error",
          description: "Failed to generate secure receipt URL.",
          variant: "destructive",
        });
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Unexpected error generating signed URL:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while accessing the receipt.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = async (transactionId: string) => {
    const signedUrl = await generateSignedUrl(transactionId);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  return {
    viewReceipt,
    generateSignedUrl,
    loading,
  };
};