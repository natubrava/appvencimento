'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const links = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/products', label: 'Produtos', icon: '📦' },
        { href: '/history', label: 'Histórico', icon: '📋' },
        { href: '/settings', label: 'Configurações', icon: '⚙️' },
    ];

    return (
        <>
            {/* Botão mobile para abrir sidebar */}
            <button
                className="sidebar-mobile-toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Menu"
            >
                ☰
            </button>

            <aside className={`sidebar ${collapsed ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">🌿</span>
                        <span className="logo-text">NatuBrava</span>
                    </div>
                    <div className="sidebar-header-row">
                        <span className="sidebar-subtitle">Controle de Vencimentos</span>
                        <NotificationBell />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`sidebar-link ${pathname === link.href ? 'sidebar-link-active' : ''}`}
                            onClick={() => setCollapsed(false)}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            <span className="sidebar-link-label">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <span className="sidebar-version">v1.0 MVP</span>
                </div>
            </aside>

            {/* Overlay para mobile */}
            {collapsed && (
                <div className="sidebar-overlay" onClick={() => setCollapsed(false)} />
            )}
        </>
    );
}
