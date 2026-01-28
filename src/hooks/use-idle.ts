import { useState, useEffect, useRef } from 'react';

export function useIdle(timeout: number) {
    const [isIdle, setIsIdle] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleActivity = () => {
            setIsIdle(false);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, timeout);
        };

        // Events to track
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Initial timer
        timerRef.current = setTimeout(() => {
            setIsIdle(true);
        }, timeout);

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeout]);

    return isIdle;
}
