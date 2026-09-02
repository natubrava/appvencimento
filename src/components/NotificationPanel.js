'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllNotifications, markNotificationSeen, markAllNotificationsSeen } from '@/lib/notifications';
import { formatDate, daysUntilExpiry } from '@/lib/utils';

export default function NotificationPanel({ onClose, stockDiscrepancies = [] }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            setLoading(true);
            const data = await getAllNotifications(50);
            setNotifications(data);
        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkSeen(id) {
        try {
            await markNotificationSeen(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, seen: true } : n)
            );
        } catch (err) {
            console.error('Erro ao marcar como vista:', err);
        }
    }

    async function handleMarkAllSeen() {
        try {
            await markAllNotificationsSeen();
            setNotifications(prev =>
                prev.map(n => ({ ...n, seen: true }))
            );
        } catch (err) {
            console.error('Erro ao marcar todas como vistas:', err);
        }
    }

    function getNotificationIcon(daysBefore) {
        if (daysBefore < 0) return '🔴';
        if (daysBefore === 0) return '⚠️';
        if (daysBefore <= 7) return '🟡';
        if (daysBefore <= 30) return '🟠';
        return '🔵';
    }

    function getNotificationMessage(notification) {
        const record = notification.expiry_records;
        const rule = notification.notification_rules;

        if (!record || !rule) return 'Notificação';

        const days = daysUntilExpiry(record.expiry_date);
        const productName = record.product_name;

        if (days < 0) {
            return `${productName} — vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`;
        }
        if (days === 0) {
            return `${productName} — vence HOJE!`;
        }
        return `${productName} — vence em ${days} dia${days !== 1 ? 's' : ''}`;
    }

    function formatNotificationTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'agora';
        if (diffMin < 60) return `há ${diffMin}min`;
        if (diffHrs < 24) return `há ${diffHrs}h`;
        if (diffDays < 7) return `há ${diffDays}d`;
        return formatDate(dateStr.split('T')[0]);
    }

    const unseenCount = notifications.filter(n => !n.seen).length;

    return (
        <div className="notification-panel-overlay" onClick={onClose}>
            <div className="notification-panel" onClick={e => e.stopPropagation()}>
                <div className="notification-panel-header">
                    <h3>🔔 Notificações</h3>
                    <div className="notification-panel-actions">
                        {unseenCount > 0 && (
                            <button
                                className="btn btn-xs btn-secondary"
                                onClick={handleMarkAllSeen}
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="notification-panel-body">
                    {loading ? (
                        <div className="notification-loading">
                            <div className="spinner" style={{ width: 24, height: 24 }}></div>
                            <span>Carregando...</span>
                        </div>
                    ) : notifications.length === 0 && stockDiscrepancies.length === 0 ? (
                        <div className="notification-empty">
                            <span className="notification-empty-icon">✅</span>
                            <p>Nenhuma notificação no momento</p>
                            <p className="text-muted">Os alertas aparecerão aqui quando houver vencimentos ou divergências de estoque.</p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {stockDiscrepancies.length > 0 && (
                                <div className="stock-notification-section">
                                    <div className="stock-notification-title">
                                        ⚠️ Estoque físico menor que o cadastrado ({stockDiscrepancies.length})
                                    </div>
                                    {stockDiscrepancies.map(alert => (
                                        <Link
                                            key={`stock-${alert.sku}`}
                                            href={`/products?sku=${encodeURIComponent(alert.sku)}`}
                                            className="notification-item notification-stock-alert"
                                            onClick={onClose}
                                        >
                                            <span className="notification-item-icon">📦</span>
                                            <div className="notification-item-content">
                                                <span className="notification-item-message">
                                                    {alert.productName} — estoque {alert.physicalStock}; cadastrado {alert.registeredQuantity}
                                                </span>
                                                <span className="notification-item-rule">
                                                    Toque para informar se foi vendido, descartado ou resolvido.
                                                </span>
                                            </div>
                                            <div className="notification-item-meta">
                                                <span className="notification-dot"></span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {notifications.map(notification => {
                                const rule = notification.notification_rules;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!notification.seen ? 'notification-unseen' : ''}`}
                                        onClick={() => !notification.seen && handleMarkSeen(notification.id)}
                                    >
                                        <span className="notification-item-icon">
                                            {getNotificationIcon(rule?.days_before ?? 0)}
                                        </span>
                                        <div className="notification-item-content">
                                            <span className="notification-item-message">
                                                {getNotificationMessage(notification)}
                                            </span>
                                            <span className="notification-item-rule">
                                                {rule?.label || 'Regra'}
                                                {notification.expiry_records?.batch_label && (
                                                    <> • Lote: {notification.expiry_records.batch_label}</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="notification-item-meta">
                                            <span className="notification-item-time">
                                                {formatNotificationTime(notification.sent_at)}
                                            </span>
                                            {!notification.seen && (
                                                <span className="notification-dot"></span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
