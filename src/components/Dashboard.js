'use client';

import { useState, useEffect } from 'react';
import { fetchProducts } from '@/lib/sheets';
import { getDashboardStats } from '@/lib/supabase';
import { getExpiryStatus, daysUntilExpiry, formatDate, getStatusLabel } from '@/lib/utils';
import ExpiryModal from './ExpiryModal';
import ActionModal from './ActionModal';
import ZeroStockModal from './ZeroStockModal';

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, expired: 0, urgent: 0, warning: 0, ok: 0, records: [] });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showZeroStockModal, setShowZeroStockModal] = useState(false);

    async function loadStats() {
        try {
            setLoading(true);
            const [data, prods] = await Promise.all([
                getDashboardStats(),
                fetchProducts()
            ]);
            setStats(data);
            setProducts(prods);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadStats();
    }, []);

    function handleAction(record) {
        setSelectedRecord(record);
        setShowActionModal(true);
    }

    function handleActionComplete() {
        setShowActionModal(false);
        setSelectedRecord(null);
        loadStats();
    }

    function handleEdit(record) {
        setSelectedRecord(record);
        setShowEditModal(true);
    }

    function handleEditComplete() {
        setShowEditModal(false);
        setSelectedRecord(null);
        loadStats();
    }

    function handleZeroStockResolve(product) {
        setSelectedProduct(product);
        setShowZeroStockModal(true);
    }

    function handleZeroStockComplete() {
        setShowZeroStockModal(false);
        setSelectedProduct(null);
        loadStats();
    }

    // Ordenar registros: vencidos primeiro, depois por data mais próxima
    const sortedRecords = [...(stats.records || [])].sort((a, b) => {
        return new Date(a.expiry_date) - new Date(b.expiry_date);
    });

    const urgentRecords = sortedRecords.slice(0, 15);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral dos vencimentos</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="stats-grid">
                <div className="stat-card stat-total">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Registros</span>
                    </div>
                </div>

                <div className="stat-card stat-expired">
                    <div className="stat-icon">⚫</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.expired}</span>
                        <span className="stat-label">Vencidos</span>
                    </div>
                </div>

                <div className="stat-card stat-urgent">
                    <div className="stat-icon">🔴</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.urgent}</span>
                        <span className="stat-label">Urgente</span>
                    </div>
                </div>

                <div className="stat-card stat-warning">
                    <div className="stat-icon">🟡</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.warning}</span>
                        <span className="stat-label">Atenção</span>
                    </div>
                </div>

                <div className="stat-card stat-ok">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.ok}</span>
                        <span className="stat-label">Dentro do Prazo</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <h2 className="section-title">⚠️ Itens Mais Urgentes</h2>

                {urgentRecords.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhum vencimento registrado ainda.</p>
                        <p className="empty-hint">Vá para <strong>Produtos</strong> para começar a registrar vencimentos.</p>
                    </div>
                ) : (
                    <div className="urgent-list">
                        {urgentRecords.map(record => {
                            const status = getExpiryStatus(record.expiry_date, record.alert_yellow_days, record.alert_red_days);
                            const days = daysUntilExpiry(record.expiry_date);

                            const product = products.find(p => p.sku === record.sku);
                            
                            // Calcula total de todos os vencimentos ativos desse produto
                            const totalQtySubmissions = stats.records
                                .filter(r => r.sku === record.sku && r.status === 'active')
                                .reduce((sum, r) => sum + (r.quantity || 1), 0);
                            
                            const isStockDiscrepancy = product && (product.stock < totalQtySubmissions);

                            return (
                                <div key={record.id} className={`urgent-item urgent-${status}`}>
                                    <div className="urgent-info">
                                        <span className="urgent-name">{record.product_name}</span>
                                        <span className="urgent-meta">
                                            SKU: {record.sku}
                                            {record.batch_label && ` • Lote: ${record.batch_label}`}
                                            {record.quantity > 1 && ` • Qtd: ${record.quantity}`}
                                        </span>
                                    </div>
                                    <div className="urgent-status-actions-mobile-row">
                                        <div className="urgent-status">
                                            <span className={`expiry-badge badge-${status}`}>
                                                {status === 'expired' && `Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`}
                                                {status === 'urgent' && `Vence em ${days} dia${days !== 1 ? 's' : ''}`}
                                                {status === 'warning' && `Vence em ${days} dia${days !== 1 ? 's' : ''}`}
                                                {status === 'ok' && `${days} dias restantes`}
                                            </span>
                                            <span className="urgent-date">{formatDate(record.expiry_date)}</span>
                                        </div>
                                        <div className="urgent-actions-mobile" style={{ display: 'flex', gap: '6px' }}>
                                            {isStockDiscrepancy && (
                                                <button 
                                                    className="btn btn-sm btn-warning-outline"
                                                    onClick={() => handleZeroStockResolve({ ...product, name: record.product_name })}
                                                    title="Divergência de Estoque (Resolver)"
                                                    style={{ padding: '0 8px', borderColor: '#f59e0b', color: '#b45309', fontWeight: 'bold' }}
                                                >
                                                    ⚠️ Estoque!
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-action"
                                                onClick={() => handleEdit(record)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-sm btn-action"
                                                onClick={() => handleAction(record)}
                                                title="Resolver"
                                            >
                                                ✓
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showActionModal && selectedRecord && (
                <ActionModal
                    record={selectedRecord}
                    onClose={() => { setShowActionModal(false); setSelectedRecord(null); }}
                    onComplete={handleActionComplete}
                />
            )}

            {showEditModal && selectedRecord && (
                <ExpiryModal
                    product={{ sku: selectedRecord.sku, name: selectedRecord.product_name }}
                    initialData={selectedRecord}
                    onClose={() => { setShowEditModal(false); setSelectedRecord(null); }}
                    onComplete={handleEditComplete}
                />
            )}

            {showZeroStockModal && selectedProduct && (
                <ZeroStockModal
                    product={selectedProduct}
                    recordsCount={stats.records
                        .filter(r => r.sku === selectedProduct.sku && r.status === 'active')
                        .reduce((sum, r) => sum + (r.quantity || 1), 0)}
                    onClose={() => { setShowZeroStockModal(false); setSelectedProduct(null); }}
                    onComplete={handleZeroStockComplete}
                />
            )}
        </div>
    );
}
