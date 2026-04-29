import { useState, useEffect, useCallback } from 'react';

const useCountdownTimer = (initialMinutes = 5) => {
    const initialTimeInSeconds = initialMinutes * 60;
    const [timeRemaining, setTimeRemaining] = useState(initialTimeInSeconds);
    const [isCounting, setIsCounting] = useState(false);

    useEffect(() => {
        let timerId: number | undefined;

        if (isCounting && timeRemaining > 0) {
            timerId = window.setInterval(() => {
                setTimeRemaining((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            if (timerId) {
                clearInterval(timerId);
            }
            setIsCounting(false);
        }

        return () => {
            if (timerId) {
                clearInterval(timerId);
            }
        };
    }, [isCounting, timeRemaining]);

    const start = useCallback(() => {
        if (!isCounting && timeRemaining > 0) {
            setIsCounting(true);
        }
    }, [isCounting, timeRemaining]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return {
        timeRemaining,
        formattedTime: formatTime(timeRemaining),
        start,
    };
};

export default useCountdownTimer;
