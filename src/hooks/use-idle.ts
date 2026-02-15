import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'sis_davus_last_active';

export function useIdle(timeout: number) {
    const [isIdle, setIsIdle] = useState(false);

    // Use a ref for last active time to avoid unnecessary re-renders
    const lastActiveRef = useRef<number>(Date.now());

    // Check storage on mount to restore state
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const lastActive = parseInt(stored, 10);
            if (!isNaN(lastActive)) {
                lastActiveRef.current = lastActive;
                const elapsed = Date.now() - lastActive;
                if (elapsed >= timeout) {
                    setIsIdle(true);
                }
            }
        }
    }, [timeout]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timer: NodeJS.Timeout;

        const startTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                setIsIdle(true);
            }, timeout);
        };

        const handleActivity = () => {
            // If we were idle, we are now active
            if (isIdle) {
                setIsIdle(false);
            }

            lastActiveRef.current = Date.now();
            startTimer();
        };

        // Throttle event handling to improve performance
        let lastEventTime = 0;
        const throttledHandler = () => {
            const now = Date.now();
            // Throttle to run at most once every 500ms
            if (now - lastEventTime > 500) {
                handleActivity();
                lastEventTime = now;
            }
        };

        // Save logic
        const saveTimestamp = () => {
            localStorage.setItem(STORAGE_KEY, lastActiveRef.current.toString());
        };

        // Save to storage periodically (every 10s) to keep it relatively fresh
        // but avoid disk IO on every mouse move
        const saveInterval = setInterval(saveTimestamp, 10000);

        // Save immediately on visibility change (tab switch/close)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                saveTimestamp();
            }
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => window.addEventListener(event, throttledHandler));
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', saveTimestamp);

        // Start the idle timer
        // If we are already idle (from initial check), this timer will just redundant set it to true later
        // If we are active, this ensures we go idle
        startTimer();

        return () => {
            if (timer) clearTimeout(timer);
            if (saveInterval) clearInterval(saveInterval);
            events.forEach(event => window.removeEventListener(event, throttledHandler));
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', saveTimestamp);
        };
    }, [timeout, isIdle]);

    return isIdle;
}
