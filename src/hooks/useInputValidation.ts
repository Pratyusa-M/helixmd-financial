import { useMemo } from 'react';

export const useInputValidation = () => {
  
  const sanitizeInput = useMemo(() => (input: string): string => {
    if (!input) return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/script injection chars
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/data:/gi, '') // Remove data protocol
      .replace(/vbscript:/gi, '') // Remove vbscript protocol
      .trim()
      .slice(0, 1000); // Limit length
  }, []);

  const validateEmail = useMemo(() => (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }, []);

  const validateAmount = useMemo(() => (amount: string): boolean => {
    const numericRegex = /^\d*\.?\d{0,2}$/;
    const numValue = parseFloat(amount);
    return numericRegex.test(amount) && numValue >= 0 && numValue <= 999999.99;
  }, []);

  const validateDescription = useMemo(() => (description: string): boolean => {
    if (!description) return true; // Optional field
    return description.length <= 500 && !description.includes('<script>');
  }, []);

  const sanitizeSearchQuery = useMemo(() => (query: string): string => {
    if (!query) return '';
    
    // Basic SQL injection prevention and XSS protection
    return query
      .replace(/['"\\;]/g, '') // Remove quotes and semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .trim()
      .slice(0, 100); // Limit search query length
  }, []);

  const validateFileName = useMemo(() => (fileName: string): boolean => {
    // Allow only alphanumeric, dots, hyphens, underscores
    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    return fileNameRegex.test(fileName) && 
           fileName.length <= 255 && 
           !fileName.includes('..') &&
           !fileName.startsWith('.') &&
           !fileName.endsWith('.');
  }, []);

  const validateCategoryRule = useMemo(() => (rule: {
    match_text: string;
    match_type: string;
    category: string;
    subcategory?: string;
  }): { isValid: boolean; error?: string } => {
    
    if (!rule.match_text || rule.match_text.length < 2) {
      return { isValid: false, error: 'Match text must be at least 2 characters long' };
    }
    
    if (rule.match_text.length > 100) {
      return { isValid: false, error: 'Match text cannot exceed 100 characters' };
    }
    
    if (!['contains', 'equals'].includes(rule.match_type)) {
      return { isValid: false, error: 'Invalid match type' };
    }
    
    if (!rule.category || rule.category.length < 2) {
      return { isValid: false, error: 'Category is required' };
    }
    
    // Check for potential regex injection
    try {
      new RegExp(rule.match_text);
    } catch (e) {
      return { isValid: false, error: 'Invalid characters in match text' };
    }
    
    return { isValid: true };
  }, []);

  return {
    sanitizeInput,
    validateEmail,
    validateAmount,
    validateDescription,
    sanitizeSearchQuery,
    validateFileName,
    validateCategoryRule,
  };
};