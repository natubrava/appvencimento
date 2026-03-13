export function getExpiryStatus(expiryDate, alertYellowDays = 90, alertRedDays = 60) {
    const diffDays = daysUntilExpiry(expiryDate);

    if (diffDays <= 0) return 'expired';
    if (diffDays <= alertRedDays) return 'urgent';
    if (diffDays <= alertYellowDays) return 'warning';
    return 'ok';
}

export function daysUntilExpiry(expiryDate) {
    // Cria data atual baseada no horário local do navegador, e zera horas
    const nowLocal = new Date();
    nowLocal.setHours(0, 0, 0, 0);
    
    // Cria a data de vencimento interpretando no mesmo fuso local do navegador
    // (A data que vem do banco geralmente é YYYY-MM-DD)
    const [year, month, day] = expiryDate.split('-');
    const expiryLocal = new Date(year, month - 1, day, 0, 0, 0, 0);

    return Math.ceil((expiryLocal - nowLocal) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function formatDateInput(dateStr) {
    if (!dateStr) return '';
    // Retorna formato YYYY-MM-DD para input type="date"
    return dateStr.split('T')[0];
}

export function normalizeText(text) {
    if (!text) return '';
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function formatPrice(price) {
    return price.toFixed(2).replace('.', ',');
}

export function getStatusLabel(status) {
    const labels = {
        active: 'Ativo',
        sold: 'Vendido',
        discarded: 'Descartado',
        resolved: 'Resolvido'
    };
    return labels[status] || status;
}

export function getExpiryStatusLabel(status) {
    switch (status) {
        case 'expired': return 'Vencido';
        case 'urgent': return 'Urgente';
        case 'warning': return 'Atenção';
        case 'ok': return 'No Prazo';
        default: return 'Desconhecido';
    }
}
