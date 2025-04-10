
import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional helper to normalize Telegram IDs when used for platform_id inputs */
  normalizeTelegramId?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, normalizeTelegramId, onChange, ...props }, ref) => {
    // Handle special case for normalizing Telegram platform IDs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (normalizeTelegramId && e.target.value) {
        const value = e.target.value;
        let normalizedValue = value.trim();
        
        // Handle URLs - extract username
        if (normalizedValue.includes('t.me/') || normalizedValue.includes('telegram.me/')) {
          const parts = normalizedValue.split('/');
          let username = parts[parts.length - 1].split('?')[0]; // Remove query parameters if any
          
          // If it looks like a username and doesn't start with @, add it
          if (!username.startsWith('@') && !username.startsWith('-') && isNaN(Number(username))) {
            username = '@' + username;
          }
          
          normalizedValue = username;
        } 
        // If it looks like a username but doesn't start with @ add it
        else if (!normalizedValue.startsWith('@') && !normalizedValue.startsWith('-') && !normalizedValue.startsWith('http') && isNaN(Number(normalizedValue))) {
          normalizedValue = '@' + normalizedValue;
        }
        
        // Set the normalized value in the input
        // Use Object.defineProperty to preserve other event properties
        Object.defineProperty(e, 'target', {
          writable: true,
          value: { ...e.target, value: normalizedValue }
        });
      }
      
      if (onChange) {
        onChange(e);
      }
    };
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
