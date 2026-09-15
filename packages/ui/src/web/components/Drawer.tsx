import type { ReactElement } from 'react';
import { cn } from '../cn';
import { DialogContent, type DialogContentProps } from './Dialog';

export type DrawerSide = 'left' | 'right';

export interface DrawerContentProps extends DialogContentProps {
  /** The edge the panel is parked against. */
  readonly side?: DrawerSide | undefined;
}

/**
 * The sliding panel. A drawer is a modal `<dialog>` parked against an edge, so the focus trap,
 * the inert page, Escape and focus return are the engine's, exactly as they are for Dialog.
 * Only the geometry and the slide differ, and both live in CSS.
 */
export function DrawerContent({
  side = 'right',
  className,
  ...props
}: DrawerContentProps): ReactElement {
  return (
    <DialogContent
      data-slot="drawer-content"
      data-side={side}
      className={cn('drawer-content', className)}
      {...props}
    />
  );
}

/*
 * The remaining parts are Dialog's: a drawer differs in where it sits, not in what it is, and a
 * second copy of the trigger, close and labelling logic would only be a second thing to keep
 * correct. They are aliased rather than wrapped so the behaviour cannot drift.
 */
export {
  Dialog as Drawer,
  DialogClose as DrawerClose,
  DialogDescription as DrawerDescription,
  DialogTitle as DrawerTitle,
  DialogTrigger as DrawerTrigger,
} from './Dialog';
export type {
  DialogCloseProps as DrawerCloseProps,
  DialogProps as DrawerProps,
  DialogTriggerProps as DrawerTriggerProps,
} from './Dialog';
