import { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Shimmer({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-safe:animate-[shimmer_2.8s_ease-in-out_infinite]', className)} {...props} />;
}

export { Shimmer };
