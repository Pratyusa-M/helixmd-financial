// Secure logging utility that filters sensitive data in production

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class SecureLogger {
  private isDevelopment = import.meta.env.DEV;
  
  // List of sensitive keys to filter out
  private sensitiveKeys = [
    'password',
    'token',
    'auth',
    'key',
    'secret',
    'credentials',
    'session',
    'jwt',
    'authorization',
    'cookie'
  ];

  private filterSensitiveData(data: LogData): LogData {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const filtered: LogData = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some(sensitiveKey => 
        lowerKey.includes(sensitiveKey)
      );
      
      if (isSensitive) {
        filtered[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = this.filterSensitiveData(value);
      } else {
        filtered[key] = value;
      }
    }
    
    return filtered;
  }

  private log(level: LogLevel, message: string, data?: LogData) {
    // Only log in development mode
    if (!this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const filteredData = data ? this.filterSensitiveData(data) : undefined;
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...(filteredData && { data: filteredData })
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, filteredData);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, filteredData);
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, message, filteredData);
        break;
      case 'debug':
      default:
        console.log(`[${timestamp}] DEBUG:`, message, filteredData);
        break;
    }
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }
}

export const logger = new SecureLogger();