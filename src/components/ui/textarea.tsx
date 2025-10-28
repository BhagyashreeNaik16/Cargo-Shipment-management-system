import * as React from 'react';
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type
import {cn} from '@/lib/utils';

// Extend the props to include an optional Icon component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  Icon?: LucideIcon;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({className, Icon, ...props}, ref) => {
    return (
       <div className="relative w-full">
         {Icon && (
          <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background py-2 px-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
             Icon ? "pl-9" : "pl-3", // Add padding-left if Icon exists
             Icon ? "pt-8" : "pt-2", // Adjust padding-top if Icon exists to avoid overlap
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
