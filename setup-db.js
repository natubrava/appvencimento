// Script para criar as tabelas no Supabase
// Execute com: node setup-db.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ocsgblhsxthndyqzpugr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc2dibGhzeHRobmR5cXpwdWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzUsImV4cCI6MjA4ODczMjc3NX0.HLn_vL0nfcE6pB12B9ss6WN4F3hbu555tZaWjmGIy-I'
);

async function setup() {
    console.log('Testando conexão com Supabase...');

    // Tenta inserir um registro de teste na tabela settings
    // Se a tabela não existe, vai falhar e precisamos criar via Dashboard
    const { data, error } = await supabase.from('settings').select('*').limit(1);

    if (error) {
        console.log('❌ Tabelas ainda não existem. Execute o SQL abaixo no Supabase Dashboard:');
        console.log('   Acesse: https://supabase.com/dashboard/project/ocsgblhsxthndyqzpugr/sql/new');
        console.log('   Cole o conteúdo do arquivo supabase-schema.sql e clique em Run');
        console.log('');
        console.log('Erro:', error.message);
    } else {
        console.log('✅ Conexão OK! Tabelas já existem.');
        console.log('Dados settings:', data);
    }
}

setup().catch(console.error);
