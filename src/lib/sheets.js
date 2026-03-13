const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
];

// Cache em memória
let cachedProducts = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        throw new Error('CSV inválido ou vazio');
    }

    const rawLines = csvText.trim().split(/\r\n|\n|\r/);
    const lines = [];
    let currentLineBuffer = '';

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];

        if (currentLineBuffer) {
            currentLineBuffer += '\n' + line;
        } else {
            currentLineBuffer = line;
        }

        const quoteCount = (currentLineBuffer.match(/"/g) || []).length;

        if (quoteCount % 2 === 0) {
            lines.push(currentLineBuffer);
            currentLineBuffer = '';
        }
    }

    if (lines.length < 2) {
        throw new Error('CSV deve ter cabeçalho e dados');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj = {};
        headers.forEach((header, index) => {
            let value = (values[index] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1).replace(/""/g, '"');
            }
            obj[header] = value;
        });
        return obj;
    });
}

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(',', '.')) || 0;
}

async function fetchWithProxy(url) {
    for (const proxy of PROXIES) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url), {
                headers: { 'Accept': 'text/csv,text/plain,*/*' }
            });
            if (response.ok) return response;
        } catch (e) {
            continue;
        }
    }
    throw new Error('Todos os proxies falharam');
}

export async function fetchProducts() {
    // Retorna cache se válido
    if (cachedProducts && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedProducts;
    }

    let response;
    try {
        response = await fetch(SHEET_CSV_URL, {
            headers: { 'Accept': 'text/csv,text/plain,*/*', 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error('Acesso direto falhou');
    } catch (e) {
        response = await fetchWithProxy(SHEET_CSV_URL);
    }

    const csvText = await response.text();
    if (!csvText.trim()) throw new Error('Planilha vazia');

    const rawData = parseCSV(csvText);

    const products = rawData
        .filter(item => item.SKU && (item.NOME_SITE || item.NOME || item.Nome_Uniplus))
        .map((item, index) => {
            const isGranel = (item.CATEGORIA || item.Grupo || '').toUpperCase() === 'GRANEL';
            const basePrice = parsePrice(item.PRECO || item.Preco_Uniplus);
            const stockValue = (item.ESTOQUE || item.Estoque)
                ? parseFloat((item.ESTOQUE || item.Estoque).toString().replace(',', '.')) || 0
                : 0;

            const eanRaw = item.EAN_alt || item.EAN || item.Ean_alt || '';
            const barcodes = eanRaw ? eanRaw.split(',').map(c => c.trim()) : [];

            return {
                sku: item.SKU,
                name: item.NOME_SITE || item.NOME || item.Nome_Uniplus || 'Produto sem nome',
                price: basePrice,
                stock: stockValue,
                category: item.CATEGORIA || item.Grupo || 'Outros',
                image: item.URL_FOTO || item['LINK DA FOTO DOS PRODUTOS'] || item['LINK DA FOTO'] || '',
                isGranel,
                tags: item.TAGS || '',
                barcodes: barcodes,
            };
        })
        .filter(p => p.name !== 'Produto sem nome');

    cachedProducts = products;
    cacheTimestamp = Date.now();

    return products;
}

export function clearProductsCache() {
    cachedProducts = null;
    cacheTimestamp = 0;
}
