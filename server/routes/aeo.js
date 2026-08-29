const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');

// We use req.supabase attached from server.js for DB operations.

// Get all AEO scenarios (Read-only)
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

// Add new AEO scenario (Protected: Admin Only)
router.post('/', verifyAdmin, async (req, res) => {
    const { target_problem, solution_text, schema_type } = req.body;
    if (!target_problem || !solution_text) {
        return res.status(400).json({ error: 'Target problem dan solution text wajib diisi.' });
    }

    const { data, error } = await req.supabase
        .from('aeo_oss_scenarios')
        .insert([{ target_problem, solution_text, schema_type }])
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Toggle is_active status (Protected: Admin Only)
router.patch('/:id/toggle', verifyAdmin, async (req, res) => {
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
