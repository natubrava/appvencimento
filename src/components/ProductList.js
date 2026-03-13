'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '@/lib/sheets';
import { getExpiryRecords } from '@/lib/supabase';
import { getExpiryStatus, daysUntilExpiry, formatDate, normalizeText, formatPrice } from '@/lib/utils';
import ExpiryModal from './ExpiryModal';
import ActionModal from './ActionModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import ZeroStockModal from './ZeroStockModal';
import toast from 'react-hot-toast';

export default function ProductList({ defaultAlertDays = 30 }) {
    const [products, setProducts] = useState([]);
    const [expiryRecords, setExpiryRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showExpiryModal, setShowExpiryModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showZeroStockModal, setShowZeroStockModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [sortBy, setSortBy] = useState('name-asc');
    const [visibleCount, setVisibleCount] = useState(50);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [prods, records] = await Promise.all([
                fetchProducts(),
                getExpiryRecords({ status: statusFilter === 'all' ? undefined : undefined })
            ]);
            setProducts(prods);
            setExpiryRecords(records);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Agrupa vencimentos por SKU
    const expiryBySku = {};
    expiryRecords.forEach(record => {
        if (!expiryBySku[record.sku]) expiryBySku[record.sku] = [];
        expiryBySku[record.sku].push(record);
    });

    // Categorias únicas
    const categories = [...new Set(products.map(p => p.category))].sort();

    // Filtra produtos
    const filteredProducts = products.filter(product => {
        // Busca por nome ou SKU
        if (searchTerm) {
            const search = normalizeText(searchTerm);
            const searchTerms = search.split(' ').filter(t => t.length > 0);
            const productText = normalizeText(`${product.name} ${product.sku} ${(product.barcodes || []).join(' ')}`);
            if (!searchTerms.every(term => productText.includes(term))) return false;
        }

        // Filtro por categoria
        if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

        // Filtro por estoque
        const stockValue = product.stock || 0;
        if (stockFilter === 'in-stock' && stockValue <= 0) return false;
        if (stockFilter === 'out-of-stock' && stockValue > 0) return false;

        if (statusFilter !== 'all') {
            const records = expiryBySku[product.sku] || [];
            const activeRecords = records.filter(r => r.status === 'active');

            if (statusFilter === 'no_expiry') {
                return activeRecords.length === 0;
            }

            if (activeRecords.length === 0) return false;

            const hasStatus = activeRecords.some(r => {
                const s = getExpiryStatus(r.expiry_date, r.alert_yellow_days, r.alert_red_days);
                return s === statusFilter;
            });

            if (!hasStatus) return false;
        }

        return true;
    });

    // Ordenação
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        // Primeiro, ordenar por prioridade de vencimento se o filtro de vencimento estiver ativo?
        // Mas o usuário pediu ordenação explícita por nome, estoque, preço.
        if (sortBy === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'stock-desc') {
            return (b.stock || 0) - (a.stock || 0);
        } else if (sortBy === 'stock-asc') {
            return (a.stock || 0) - (b.stock || 0);
        } else if (sortBy === 'price-desc') {
            const getPrice = (p) => parseFloat(String(p.price || '0').replace('R$', '').replace(',', '.').trim()) || 0;
            return getPrice(b) - getPrice(a);
        }
        return 0;
    });

    function getProductExpiryStatus(sku) {
        const records = (expiryBySku[sku] || []).filter(r => r.status === 'active');
        if (records.length === 0) return null;

        let worstStatus = 'ok';
        let minDays = Infinity;
        const statusOrder = { expired: 4, urgent: 3, warning: 2, ok: 1 };

        records.forEach(r => {
            const s = getExpiryStatus(r.expiry_date, r.alert_yellow_days, r.alert_red_days);
            const d = daysUntilExpiry(r.expiry_date);
            if (d < minDays) minDays = d;
            
            if (statusOrder[s] > statusOrder[worstStatus]) {
                worstStatus = s;
            }
        });

        return { status: worstStatus, days: minDays, count: records.length };
    }

    function handleAddExpiry(product) {
        setSelectedProduct(product);
        setShowExpiryModal(true);
    }

    function handleExpiryComplete() {
        setShowExpiryModal(false);
        setSelectedProduct(null);
        loadData();
    }

    function handleAction(record) {
        setSelectedRecord(record);
        setShowActionModal(true);
    }

    function handleActionComplete() {
        setShowActionModal(false);
        setSelectedRecord(null);
        loadData();
    }

    function handleEdit(record, product) {
        setSelectedProduct(product);
        setSelectedRecord(record);
        setShowEditModal(true);
    }

    function handleEditComplete() {
        setShowEditModal(false);
        setSelectedRecord(null);
        setSelectedProduct(null);
        loadData();
    }

    function handleZeroStockResolve(product) {
        setSelectedProduct(product);
        setShowZeroStockModal(true);
    }

    function handleZeroStockComplete() {
        setShowZeroStockModal(false);
        setSelectedProduct(null);
        toast.success(`Pendentes resolvidos com sucesso!`, { duration: 3000 });
        loadData();
    }

    function handleBarcodeDetected(code) {
        setShowScanner(false);
        toast.success(`Código Lido: ${code}`, { duration: 3000 });

        // Tentar encontrar o produto
        let foundProduct = null;
        for (const p of products) {
            if (p.barcodes && p.barcodes.includes(code)) {
                foundProduct = p;
                break;
            }
        }

        if (foundProduct) {
            setTimeout(() => {
                handleAddExpiry(foundProduct);
            }, 500); // pequeno delay visual após o toast
        } else {
            toast.error(
                `Produto não encontrado. Código: ${code}.\nVerifique na aba EDICAO.`,
                { duration: 5000 }
            );
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando produtos da planilha...</p>
            </div>
        );
    }

    return (
        <div className="product-list-page">
            <h1 className="page-title">Produtos</h1>
            <p className="page-subtitle">{products.length} produtos carregados da planilha</p>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Barra de busca e filtros */}
            <div className="filters-bar">
                <div className="search-and-scan-row">
                    <div className="search-container" style={{ flexGrow: 1 }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="search"
                            placeholder="Buscar por nome ou SKU..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setVisibleCount(50); }}
                            className="search-input"
                        />
                    </div>
                    <button 
                        className="btn btn-primary scanner-btn" 
                        onClick={() => setShowScanner(true)}
                        title="Ler Código de Barras"
                    >
                        📷
                    </button>
                </div>

                <div className="filter-group">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="expired">⚫ Vencidos</option>
                        <option value="urgent">🔴 Urgente</option>
                        <option value="warning">🟡 Atenção</option>
                        <option value="ok">🟢 Dentro do Prazo</option>
                        <option value="no_expiry">⚪ Sem Vencimento</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todas Categorias</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todo Estoque</option>
                        <option value="in-stock">Com Estoque</option>
                        <option value="out-of-stock">Sem Estoque</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value); setVisibleCount(50); }}
                        className="filter-select"
                        style={{ fontWeight: 'bold' }}
                    >
                        <option value="name-asc">A-Z (Padrão)</option>
                        <option value="stock-desc">Estoque: Maior &gt; Menor</option>
                        <option value="stock-asc">Estoque: Menor &gt; Maior</option>
                        <option value="price-desc">Preço: Maior</option>
                    </select>
                </div>
            </div>

            <div className="product-count">
                Mostrando {sortedProducts.length} de {products.length} produtos
            </div>

            {/* Lista de produtos */}
            <div className="products-grid">
                {sortedProducts.slice(0, visibleCount).map((product, index) => {
                    const expiryInfo = getProductExpiryStatus(product.sku);
                    const productRecords = (expiryBySku[product.sku] || []).filter(r => r.status === 'active');
                    const isExpanded = expandedProduct === product.sku;
                    const isZeroStockWarning = product.stock <= 0 && productRecords.length > 0;

                    return (
                        <div
                            key={`${product.sku}-${index}`}
                            className={`product-card ${expiryInfo ? `product-${expiryInfo.status}` : ''} ${isZeroStockWarning ? 'product-zero-stock' : ''}`}
                        >
                            <div className="product-card-header">
                                <div className="product-main-info">
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="product-thumb"
                                            loading="lazy"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="product-details">
                                        <h3 className="product-name">{product.name}</h3>
                                        <div className="product-meta">
                                            <span className="product-sku">SKU: {product.sku}</span>
                                            <span className="product-category">{product.category}</span>
                                            {product.stock > 0 && (
                                                <span className="product-stock">
                                                    Est: {product.isGranel ? `${product.stock.toFixed(1)}kg` : product.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="product-card-actions">
                                    {expiryInfo && (
                                        <span className={`expiry-badge badge-${expiryInfo.status}`}>
                                            {expiryInfo.status === 'expired' && '⚫ VENCIDO'}
                                            {expiryInfo.status === 'urgent' && `🔴 ${expiryInfo.days}d`}
                                            {expiryInfo.status === 'warning' && `🟡 ${expiryInfo.days}d`}
                                            {expiryInfo.status === 'ok' && `🟢 ${expiryInfo.days}d`}
                                            {expiryInfo.count > 1 && ` (${expiryInfo.count})`}
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleAddExpiry(product)}
                                        title="Adicionar vencimento"
                                    >
                                        + Vencimento
                                    </button>
                                </div>
                            </div>

                            {/* Alerta de Estoque Zero com Vencimentos Ativos */}
                            {product.stock <= 0 && productRecords.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <button 
                                        className="btn btn-warning-outline"
                                        onClick={() => handleZeroStockResolve(product)}
                                    >
                                        ⚠️ Estoque Zerado (Resolver Pendências)
                                    </button>
                                </div>
                            )}

                            {/* Vencimentos do produto */}
                            {productRecords.length > 0 && (
                                <div className="product-expiries">
                                    <button
                                        className="expiry-toggle"
                                        onClick={() => setExpandedProduct(isExpanded ? null : product.sku)}
                                    >
                                        {isExpanded ? '▼' : '▶'} {productRecords.length} vencimento{productRecords.length !== 1 ? 's' : ''} ativo{productRecords.length !== 1 ? 's' : ''}
                                    </button>

                                    {isExpanded && (
                                        <div className="expiry-details-list">
                                            {productRecords.map(record => {
                                                const rstatus = getExpiryStatus(record.expiry_date, record.alert_yellow_days, record.alert_red_days);
                                                const rdays = daysUntilExpiry(record.expiry_date);

                                                return (
                                                    <div key={record.id} className={`expiry-detail-item detail-${rstatus}`}>
                                                        <div className="expiry-detail-item-top">
                                                            <div className="expiry-detail-info">
                                                                <span className="expiry-detail-date">
                                                                    📅 {formatDate(record.expiry_date)}
                                                                </span>
                                                                {record.batch_label && <span className="expiry-detail-batch">Lote: {record.batch_label}</span>}
                                                                {record.quantity > 1 && <span className="expiry-detail-qty">Qtd: {record.quantity}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="expiry-status-actions-mobile-row">
                                                            <div className="expiry-status-mobile">
                                                                <span className={`expiry-detail-days days-${rstatus}`}>
                                                                    {rstatus === 'expired' && `Vencido há ${Math.abs(rdays)} dia(s)`}
                                                                    {rstatus === 'urgent' && `Vence em ${rdays} dia(s)`}
                                                                    {rstatus === 'warning' && `Vence em ${rdays} dia(s)`}
                                                                    {rstatus === 'ok' && `${rdays} dia(s) restantes`}
                                                                </span>
                                                            </div>
                                                            <div className="expiry-detail-actions">
                                                                <button
                                                                    className="btn btn-xs btn-action"
                                                                    onClick={() => handleEdit(record, product)}
                                                                    title="Editar Registro"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-xs btn-action"
                                                                    onClick={() => handleAction(record)}
                                                                    title="Resolver"
                                                                >
                                                                    ✓ Resolver
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {sortedProducts.length === 0 && (
                <div className="empty-state">
                    <p>Nenhum produto encontrado com os filtros selecionados.</p>
                </div>
            )}

            {visibleCount < sortedProducts.length && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        style={{ padding: '12px 24px', fontSize: '1.1rem' }}
                    >
                        Carregar mais produtos...
                    </button>
                </div>
            )}

            {/* Modais */}
            {showExpiryModal && selectedProduct && (
                <ExpiryModal
                    product={selectedProduct}
                    defaultAlertDays={defaultAlertDays}
                    onClose={() => { setShowExpiryModal(false); setSelectedProduct(null); }}
                    onComplete={handleExpiryComplete}
                />
            )}

            {showActionModal && selectedRecord && (
                <ActionModal
                    record={selectedRecord}
                    onClose={() => { setShowActionModal(false); setSelectedRecord(null); }}
                    onComplete={handleActionComplete}
                />
            )}

            {showEditModal && selectedRecord && selectedProduct && (
                <ExpiryModal
                    product={selectedProduct}
                    initialData={selectedRecord}
                    defaultAlertDays={defaultAlertDays}
                    onClose={() => { setShowEditModal(false); setSelectedRecord(null); setSelectedProduct(null); }}
                    onComplete={handleEditComplete}
                />
            )}

            {showScanner && (
                <BarcodeScannerModal 
                    onClose={() => setShowScanner(false)} 
                    onDetect={handleBarcodeDetected} 
                />
            )}

            {showZeroStockModal && selectedProduct && (
                <ZeroStockModal
                    product={selectedProduct}
                    recordsCount={(expiryBySku[selectedProduct.sku] || []).filter(r => r.status === 'active').length}
                    onClose={() => { setShowZeroStockModal(false); setSelectedProduct(null); }}
                    onComplete={handleZeroStockComplete}
                />
            )}
        </div>
    );
}
