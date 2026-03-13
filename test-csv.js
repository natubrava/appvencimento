const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6FsKfgWJxQBzkKSP3ekD-Tbb7bfvGs_Df9aUT9bkv8gPL8dySYVkMmFdlajdrgxLZUs3pufrc0ZX8/pub?gid=1274849389&single=true&output=csv';

function parseCSV(csvText) {
    const rawLines = csvText.trim().split(/\r\n|\n|\r/);
    const lines = [];
    let currentLineBuffer = '';

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (currentLineBuffer) currentLineBuffer += '\n' + line;
        else currentLineBuffer = line;

        const quoteCount = (currentLineBuffer.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) {
            lines.push(currentLineBuffer);
            currentLineBuffer = '';
        }
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

function normalizeText(text) {
    if (!text) return '';
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function run() {
    console.log("Fetching...");
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const rawData = parseCSV(text);
    console.log("Total raw rows:", rawData.length);
    
    // Find missing items in raw data
    const moresbelt = rawData.filter(r => JSON.stringify(r).toLowerCase().includes('moresbelt'));
    const unaro = rawData.filter(r => JSON.stringify(r).toLowerCase().includes('unaro') && JSON.stringify(r).toLowerCase().includes('pecan'));
    const cod3068 = rawData.filter(r => Object.values(r).some(v => String(v).includes('3068') || String(v).includes('3063')));
    
    console.log("Raw - Moresbelt:", moresbelt);
    console.log("Raw - Unaro Pecan:", unaro);
    console.log("Raw - 3068/3063:", cod3068);
    
    // Test the parsing step
    const products = rawData
        .filter(item => item.SKU && (item.NOME_SITE || item.NOME || item.Nome_Uniplus))
        .map((item, index) => {
            const isGranel = (item.CATEGORIA || item.Grupo || '').toUpperCase() === 'GRANEL';
            const basePrice = 0;
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
                rawEAN: eanRaw
            };
        })
        .filter(p => p.name !== 'Produto sem nome');
        
    console.log("Total parsed products:", products.length);
    console.log("Parsed - Moresbelt:", products.filter(r => normalizeText(r.name).includes('moresbelt')));
    console.log("Parsed - Unaro:", products.filter(r => normalizeText(r.name).includes('unaro pecan')));
    console.log("Parsed - 3068:", products.filter(r => r.sku === '3068' || r.barcodes.includes('3068')));
    console.log("Parsed - 3063:", products.filter(r => r.sku === '3063' || r.barcodes.includes('3063')));
}

run().catch(console.error);
