import { type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bubbleVariants = cva('relative flex w-fit max-w-[88%] flex-col', {
  variants: {
    variant: {
      default: 'text-black',
      secondary: 'text-zinc-100',
      muted: 'text-zinc-300',
      outline: 'text-zinc-100',
      ghost: 'max-w-none text-zinc-300',
    },
    align: { start: 'self-start', end: 'self-end' },
  },
  defaultVariants: { variant: 'secondary', align: 'start' },
});

const contentVariants = cva('rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm', {
  variants: {
    variant: {
      default: 'border-white bg-white text-black',
      secondary: 'border-white/10 bg-white/[0.045]',
      muted: 'border-white/[0.07] bg-white/[0.025] text-zinc-400',
      outline: 'border-white/15 bg-black/30',
      ghost: 'border-transparent bg-transparent px-0',
    },
  },
  defaultVariants: { variant: 'secondary' },
});

type BubbleProps = ComponentProps<'div'> & VariantProps<typeof bubbleVariants>;

function Bubble({ className, variant, align, ...props }: BubbleProps) {
  return <div data-slot="bubble" data-variant={variant} className={cn(bubbleVariants({ variant, align, className }))} {...props} />;
}

function BubbleContent({ className, variant, ...props }: ComponentProps<'div'> & Pick<VariantProps<typeof contentVariants>, 'variant'>) {
  return <div data-slot="bubble-content" className={cn(contentVariants({ variant, className }))} {...props} />;
}

function BubbleReactions({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="bubble-reactions" className={cn('mt-1 flex items-center gap-1 self-end text-[10px] text-zinc-500', className)} {...props} />;
}

export { Bubble, BubbleContent, BubbleReactions };
