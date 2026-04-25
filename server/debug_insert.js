const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createBackupAdmin() {
    console.log("Creating backup admin: admin2@landscaler.com...");

    const targetEmail = 'admin2@landscaler.com';
    const password = 'password123';

    // Hash password using bcrypt
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Check if user exists
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (user) {
        console.log("User already exists, updating password...");
        await supabase.from('users').update({
            password_hash: newPasswordHash,
            role: 'admin'
        }).eq('email', targetEmail);
        console.log("Updated admin2@landscaler.com");
    } else {
        console.log("Creating new user...");
        const { error: insertError } = await supabase.from('users').insert([{
            email: targetEmail,
            password_hash: newPasswordHash,
            name: 'Backup Admin',
            role: 'admin',
            token_balance: 99999
        }]);

        if (insertError) console.error(insertError);
        else console.log("Created admin2@landscaler.com");
    }
}

createBackupAdmin();
