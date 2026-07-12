'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

/**
 * The reusable "what do I do here" ⓘ. One component for the whole guided layer.
 *
 * - Works on hover + keyboard focus on pointer devices, and tap-to-toggle on
 *   touch (there is no hover on touch, so a plain click toggles it).
 * - The panel is portalled to <body> so it is never clipped by an
 *   overflow-hidden ancestor and always sits above modals (z-10000 > z-9999).
 * - `text` is rendered by the caller through the translation system, so it is
 *   bilingual for free — pass t('some.key') (may include <strong>, etc.).
 */
interface InfoTooltipProps {
    /** Tooltip body — already localized by the caller. May be rich content. */
    text: React.ReactNode;
    /** Accessible name for the trigger. Defaults to a localized "More information". */
    label?: string;
    /** Extra classes for the trigger button (e.g. to recolor or resize it). */
    className?: string;
    /** Icon edge length in px. Defaults to 14. */
    iconSize?: number;
}

const GAP = 8; // px between the trigger and the panel
const MARGIN = 8; // px minimum distance from the viewport edge

export function InfoTooltip({ text, label, className, iconSize = 14 }: InfoTooltipProps) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [hoverCapable, setHoverCapable] = React.useState(true);
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const tooltipId = React.useId();

    React.useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && window.matchMedia) {
            setHoverCapable(window.matchMedia('(hover: hover)').matches);
        }
    }, []);

    const computePosition = React.useCallback(() => {
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (!trigger) return;
        const r = trigger.getBoundingClientRect();
        const pw = panel?.offsetWidth ?? 0;
        const ph = panel?.offsetHeight ?? 0;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Prefer above the trigger; flip below if it would clip the top edge.
        let top = r.top - GAP - ph;
        if (top < MARGIN) {
            top = r.bottom + GAP;
            // If below also overflows, pin it inside the viewport.
            if (top + ph > vh - MARGIN) top = Math.max(MARGIN, vh - MARGIN - ph);
        }

        // Centre horizontally on the trigger, clamped to the viewport.
        let left = r.left + r.width / 2 - pw / 2;
        left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - pw - MARGIN));

        setPos({ top, left });
    }, []);

    // Measure + place before the browser paints (useLayoutEffect), so the panel's
    // first paint is already at the correct spot (it is parked off-screen until
    // `pos` is set). Keep it correct on resize; close on scroll rather than
    // letting the fixed panel drift away from its trigger.
    React.useLayoutEffect(() => {
        if (!open) return;
        computePosition();
        const onScroll = () => setOpen(false);
        const onResize = () => computePosition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, computePosition]);

    // Reset position when closed so the next open measures fresh (avoids a
    // one-frame flash at the previous location).
    React.useEffect(() => {
        if (!open) setPos(null);
    }, [open]);

    // Close on Escape or an outside pointer-down.
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const onDown = (e: PointerEvent) => {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [open]);

    // Hover devices: hover + focus. Touch devices: tap toggles (focus is ignored
    // there so it can't cancel the click on the same tap).
    const show = () => hoverCapable && setOpen(true);
    const hide = () => hoverCapable && setOpen(false);
    const toggle = () => !hoverCapable && setOpen((o) => !o);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-label={label ?? t('common.moreInfo')}
                aria-expanded={open}
                aria-describedby={open ? tooltipId : undefined}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                onClick={toggle}
                className={cn(
                    'inline-flex items-center justify-center rounded-full align-middle text-gray-400 transition-colors hover:text-teal focus:text-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50',
                    className
                )}
            >
                <Info style={{ width: iconSize, height: iconSize }} strokeWidth={2} />
            </button>

            {mounted &&
                open &&
                createPortal(
                    // Rendered conditionally (no AnimatePresence): when `open` goes
                    // false React unmounts the node immediately, so there is no exit
                    // animation left to orphan portal nodes in <body>. The panel is
                    // parked off-screen for its first (pre-measure) render and moved
                    // into place by the layout effect the same frame, so it never
                    // flashes at the wrong spot — no opacity juggling required.
                    <div
                        ref={panelRef}
                        id={tooltipId}
                        role="tooltip"
                        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
                        className="pointer-events-none fixed z-[10000] w-max max-w-[min(18rem,calc(100vw-1rem))] rounded-lg bg-midnight px-3 py-2 text-xs leading-relaxed text-white shadow-xl"
                    >
                        {text}
                    </div>,
                    document.body
                )}
        </>
    );
}
