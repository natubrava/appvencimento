'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnseenCount, checkAndGenerateNotifications } from '@/lib/notifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const [unseenCount, setUnseenCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const refreshCount = useCallback(async () => {
        try {
            const count = await getUnseenCount();
            setUnseenCount(count);
        } catch (err) {
            // Silently fail — tabelas podem não existir ainda
            console.warn('Notificações não disponíveis:', err.message);
        }
    }, []);

    useEffect(() => {
        async function init() {
            try {
                // Gerar novas notificações ao abrir o app (1x por sessão)
                if (!hasChecked) {
                    await checkAndGenerateNotifications();
                    setHasChecked(true);
                }
                await refreshCount();
            } catch (err) {
                console.warn('Notificações não disponíveis:', err.message);
            }
        }
        init();

        // Atualizar contagem a cada 5 minutos
        const interval = setInterval(refreshCount, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [hasChecked, refreshCount]);

    function handleToggle() {
        setShowPanel(!showPanel);
    }

    function handleClose() {
        setShowPanel(false);
        refreshCount();
    }

    return (
        <>
            <button
                className="notification-bell-btn"
                onClick={handleToggle}
                title="Notificações"
                aria-label={`Notificações${unseenCount > 0 ? ` (${unseenCount} novas)` : ''}`}
            >
                <span className="bell-icon">🔔</span>
                {unseenCount > 0 && (
                    <span className="notification-badge">{unseenCount > 99 ? '99+' : unseenCount}</span>
                )}
            </button>

            {showPanel && (
                <NotificationPanel onClose={handleClose} />
            )}
        </>
    );
}
