const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// We use req.supabase attached from server.js for DB operations.

// Get all AEO scenarios
router.get('/', async (req, res) => {
    const { data, error } = await req.supabase
        .from('aeo_oss_scenarios')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        // If table doesn't exist, just return empty array so it doesn't crash the frontend before user creates the table
        if (error.code === '42P01') return res.json([]);
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// Add new AEO scenario
router.post('/', async (req, res) => {
    const { target_problem, solution_text, schema_type } = req.body;
    const { data, error } = await req.supabase
        .from('aeo_oss_scenarios')
        .insert([{ target_problem, solution_text, schema_type }])
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Toggle is_active status
router.patch('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    const { data, error } = await req.supabase
        .from('aeo_oss_scenarios')
        .update({ is_active })
        .eq('id', id)
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

module.exports = router;
