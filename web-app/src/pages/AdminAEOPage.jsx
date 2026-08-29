import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function AdminAEO() {
    const [scenarios, setScenarios] = useState([]);
    const [form, setForm] = useState({ target_problem: '', solution_text: '', schema_type: 'FAQPage' });
    const { toast } = useToast();

    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        try {
            const { data } = await api.get('/aeo');
            setScenarios(data);
        } catch (error) {
            console.error("Error fetching AEO data:", error);
            toast({ title: "Error", description: "Pastikan tabel aeo_oss_scenarios sudah dibuat di Supabase", variant: "destructive" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/aeo', form);
            toast({ title: "Success", description: "AEO Scenario added." });
            setForm({ target_problem: '', solution_text: '', schema_type: 'FAQPage' });
            fetchScenarios();
        } catch (err) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/aeo/${id}/toggle`, { is_active: !currentStatus });
            fetchScenarios();
        } catch (err) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">AEO Control Panel</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="text-amber-600">Add New Scenario (Gunakan Hard-Selling BikinPolygon Pitch!)</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input 
                            placeholder="Target Problem (e.g. Cara buat polygon OSS RBA)" 
                            value={form.target_problem} 
                            onChange={e => setForm({...form, target_problem: e.target.value})} 
                            required 
                        />
                        <textarea 
                            className="w-full p-3 border rounded-md focus:ring-amber-500 text-sm" 
                            rows="4" 
                            placeholder="Solution Text (AGGRESSIVE PITCH: Hentikan cara manual...)" 
                            value={form.solution_text} 
                            onChange={e => setForm({...form, solution_text: e.target.value})} 
                            required 
                        />
                        <select 
                            className="w-full p-2 border rounded-md text-sm" 
                            value={form.schema_type} 
                            onChange={e => setForm({...form, schema_type: e.target.value})}
                        >
                            <option value="FAQPage">FAQPage</option>
                            <option value="HowTo">HowTo</option>
                            <option value="Service">Service</option>
                        </select>
                        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white">Add Scenario</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {scenarios.map(s => (
                    <Card key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                        <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {s.target_problem} <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 ml-2">{s.schema_type}</span>
                                </h3>
                                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{s.solution_text}</p>
                            </div>
                            <Button variant={s.is_active ? "destructive" : "default"} onClick={() => toggleStatus(s.id, s.is_active)}>
                                {s.is_active ? 'Disable' : 'Enable'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
