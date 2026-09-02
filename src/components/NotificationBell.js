'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnseenCount, checkAndGenerateNotifications } from '@/lib/notifications';
import { getExpiryRecords } from '@/lib/supabase';
import { fetchProducts } from '@/lib/sheets';
import { findStockDiscrepancies } from '@/lib/stock-discrepancies';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const [unseenCount, setUnseenCount] = useState(0);
    const [stockDiscrepancies, setStockDiscrepancies] = useState([]);
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

        try {
            const [products, activeRecords] = await Promise.all([
                fetchProducts(),
                getExpiryRecords({ status: 'active' }),
            ]);
            setStockDiscrepancies(findStockDiscrepancies(products, activeRecords));
        } catch (err) {
            // O sino de vencimentos continua funcionando mesmo se a planilha falhar.
            console.warn('Alertas de estoque não disponíveis:', err.message);
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

    const totalCount = unseenCount + stockDiscrepancies.length;

    return (
        <>
            <button
                className="notification-bell-btn"
                onClick={handleToggle}
                title="Notificações"
                aria-label={`Notificações${totalCount > 0 ? ` (${totalCount} pendentes)` : ''}`}
            >
                <span className="bell-icon">🔔</span>
                {totalCount > 0 && (
                    <span className="notification-badge">{totalCount > 99 ? '99+' : totalCount}</span>
                )}
            </button>

            {showPanel && (
                <NotificationPanel
                    onClose={handleClose}
                    stockDiscrepancies={stockDiscrepancies}
                />
            )}
        </>
    );
}
