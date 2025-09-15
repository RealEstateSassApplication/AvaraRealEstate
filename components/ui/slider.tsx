'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { range?: boolean }
>(({ className, range = true, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-muted/20 shadow-inner transition-colors duration-200">
      <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full transition-all duration-200 ease-out" />
    </SliderPrimitive.Track>
    {range ? (
      <>
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-card shadow-md transform transition-transform duration-150 ease-in-out hover:scale-110 focus:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-card shadow-md transform transition-transform duration-150 ease-in-out hover:scale-110 focus:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </>
    ) : (
      <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-card shadow-md transform transition-transform duration-150 ease-in-out hover:scale-110 focus:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    )}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
