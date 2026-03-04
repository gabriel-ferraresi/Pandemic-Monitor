import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
}

/**
 * Contador animado com easing suave usando requestAnimationFrame.
 * Sem dependências externas — puro CSS + JS.
 */
export function AnimatedCounter({ value, duration = 600, className = '' }: AnimatedCounterProps) {
    const [display, setDisplay] = useState(value);
    const prevValue = useRef(value);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const from = prevValue.current;
        const to = value;
        prevValue.current = value;

        if (from === to) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing: ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);

            setDisplay(current);

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate);
            }
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [value, duration]);

    return <span className={className}>{display}</span>;
}
