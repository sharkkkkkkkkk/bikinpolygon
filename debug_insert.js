const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testInsert() {
    const randomEmail = `test_${Date.now()}@example.com`;
    console.log("Attempting to insert:", randomEmail);

    const { data, error } = await supabase.from('users').insert([{
        email: randomEmail,
        password_hash: 'hash',
        name: 'Test',
        whatsapp: '123',
        token_balance: 10,
        role: 'user'
    }]).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
    }
}

testInsert();
