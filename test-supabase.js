const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ocsgblhsxthndyqzpugr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc2dibGhzeHRobmR5cXpwdWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzUsImV4cCI6MjA4ODczMjc3NX0.HLn_vL0nfcE6pB12B9ss6WN4F3hbu555tZaWjmGIy-I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing connection...");
    const { data, error } = await supabase.from('expiry_records').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
test();
