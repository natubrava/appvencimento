import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = new URL('../src/lib/stock-discrepancies.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const { findStockDiscrepancies } = await import(`data:text/javascript,${encodeURIComponent(source)}`);

test('avisa quando o estoque físico é menor que os vencimentos ativos', () => {
    const alerts = findStockDiscrepancies(
        [{ sku: '229', name: 'Bicarbonato', stock: 1 }],
        [{ sku: '229', quantity: 2, status: 'active' }],
    );

    assert.deepEqual(alerts, [{
        sku: '229',
        productName: 'Bicarbonato',
        physicalStock: 1,
        registeredQuantity: 2,
        difference: 1,
    }]);
});

test('não considera registros já resolvidos', () => {
    const alerts = findStockDiscrepancies(
        [{ sku: '229', name: 'Bicarbonato', stock: 0 }],
        [{ sku: '229', quantity: 1, status: 'sold' }],
    );

    assert.deepEqual(alerts, []);
});

test('normaliza estoque físico negativo para zero no aviso', () => {
    const [alert] = findStockDiscrepancies(
        [{ sku: '1681', name: 'Produto negativo', stock: -1 }],
        [{ sku: '1681', quantity: 7, status: 'active' }],
    );

    assert.equal(alert.physicalStock, 0);
    assert.equal(alert.difference, 7);
});
