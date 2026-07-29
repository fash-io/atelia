import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:brightness-105 hover:-translate-y-0.5 shadow-[0_1px_0_oklch(0_0_0/0.08),0_8px_24px_-12px_oklch(0.92_0.18_115/0.7)]',
        ink: 'bg-foreground text-background hover:bg-foreground/90',
        outline:
          'border border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/30',
        ghost: 'text-foreground hover:bg-foreground/5',
        link: 'text-foreground underline-offset-4 hover:underline rounded-none!',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-7 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
      curve: {
        default: 'rounded-full',
        'custom-l':
          'rounded-tl-[1.2rem] rounded-tr-[0.6rem] rounded-bl-[0.6rem] rounded-br-[1.2rem] hover:rounded-tr-[1.2rem] hover:rounded-tl-[0.6rem] hover:rounded-br-[0.6rem] hover:rounded-bl-[1.2rem]',
        'custom-r':
          'rounded-tr-[1.2rem] rounded-tl-[0.6rem] rounded-br-[0.6rem] rounded-bl-[1.2rem] hover:rounded-tl-[1.2rem] hover:rounded-tr-[0.6rem] hover:rounded-bl-[0.6rem] hover:rounded-br-[1.2rem]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default', curve: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, curve, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, curve, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
