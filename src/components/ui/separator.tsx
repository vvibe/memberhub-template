import * as React from 'react'
import { cn } from '@/lib/utils'

function Separator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="separator" className={cn(className)} {...props} />
}

export { Separator }
