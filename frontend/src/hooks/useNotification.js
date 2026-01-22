import { useEffect, useCallback } from 'react';

export const useNotification = () => {
    // Request permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const sendNotification = useCallback((title, options = {}) => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                ...options,
            });

            // Auto close after 10 seconds
            setTimeout(() => notification.close(), 10000);

            // Focus window on click
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    sendNotification(title, options);
                }
            });
        }
    }, []);

    const notifyBreakTime = useCallback(() => {
        sendNotification('🌿 Time for a Break!', {
            body: 'Great work! Step away for 5 minutes. Your body will thank you.',
            tag: 'break-reminder',
        });
    }, [sendNotification]);

    const notifyWaterReminder = useCallback(() => {
        sendNotification('💧 Hydration Reminder', {
            body: 'Time to drink some water! Hydration fuels focus.',
            tag: 'water-reminder',
        });
    }, [sendNotification]);

    const notifySessionComplete = useCallback(() => {
        sendNotification('✨ Session Complete!', {
            body: 'Amazing focus session! Ready for another cycle?',
            tag: 'session-complete',
        });
    }, [sendNotification]);

    const notifyWorkComplete = useCallback(() => {
        sendNotification('🎉 Focus Session Complete!', {
            body: '60 minutes of focused work done! Time for a well-deserved break.',
            tag: 'work-complete',
        });
    }, [sendNotification]);

    return {
        sendNotification,
        notifyBreakTime,
        notifyWaterReminder,
        notifySessionComplete,
        notifyWorkComplete,
    };
};

export default useNotification;
