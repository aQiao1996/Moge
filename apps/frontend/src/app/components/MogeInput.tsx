import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

const MogeInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    if (type !== 'password') {
      return (
        <Input
          type={type}
          className={cn(
            'input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]',
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const Icon = showPassword ? Eye : EyeOff;

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]',
            'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        <div
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-500"
          onClick={togglePasswordVisibility}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    );
  }
);
MogeInput.displayName = 'MogeInput';

export { MogeInput };
