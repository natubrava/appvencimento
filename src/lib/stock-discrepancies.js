export function findStockDiscrepancies(products = [], expiryRecords = []) {
    const activeQuantityBySku = new Map();

    expiryRecords.forEach(record => {
        if (record?.status !== 'active' || record?.sku === null || record?.sku === undefined) return;
        const sku = String(record.sku);
        const quantity = Number(record.quantity) || 1;
        activeQuantityBySku.set(sku, (activeQuantityBySku.get(sku) || 0) + quantity);
    });

    return products.flatMap(product => {
        const sku = String(product?.sku ?? '');
        const registeredQuantity = activeQuantityBySku.get(sku) || 0;
        const physicalStock = Number(product?.stock);

        if (!sku || registeredQuantity <= 0 || !Number.isFinite(physicalStock) || physicalStock >= registeredQuantity) {
            return [];
        }

        return [{
            sku,
            productName: product.name || `Produto ${sku}`,
            physicalStock: Math.max(0, physicalStock),
            registeredQuantity,
            difference: registeredQuantity - Math.max(0, physicalStock),
        }];
    }).sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR'));
}
