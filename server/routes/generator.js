const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');


// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEG_TO_RAD = Math.PI / 180;

const verifyUser = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

router.post('/create', verifyUser, async (req, res) => {
    const { lat, lng, area, customPoints } = req.body;
    const user_id = req.user.id;

    if ((!lat || !lng || !area) && !customPoints) return res.status(400).json({ error: 'Missing parameters' });

    try {
        console.log(`[Generator] Request from User: ${user_id}`);

        // 1. Check tokens
        const { data: user, error: userError } = await supabase.from('users').select('token_balance').eq('id', user_id).single();

        if (userError) {
            console.error('[Generator] DB Error:', userError);
            throw new Error('Database error fetching user');
        }

        if (!user || user.token_balance < 5) {
            return res.status(403).json({ error: 'Insufficient tokens' });
        }

        // 2. Deduct tokens
        const { error: updateError } = await supabase.from('users').update({ token_balance: user.token_balance - 5 }).eq('id', user_id);
        if (updateError) {
            console.error('[Generator] Deduct Error:', updateError);
            throw updateError;
        }

        let points = [];
        let minX = 180, maxX = -180, minY = 90, maxY = -90;

        if (customPoints && Array.isArray(customPoints) && customPoints.length >= 3) {
            // Use custom points (expecting [[lng, lat], ...])
            // Ensure closed loop
            points = [...customPoints];
            const first = points[0];
            const last = points[points.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                points.push(first);
            }

            // Calculate BBOX
            for (let p of points) {
                if (p[0] < minX) minX = p[0];
                if (p[0] > maxX) maxX = p[0];
                if (p[1] < minY) minY = p[1];
                if (p[1] > maxY) maxY = p[1];
            }
        } else {
            // 3. Calculate Geometry (Square) Fallback
            const sideMeters = Math.sqrt(area);
            const halfSide = sideMeters / 2;
            const dLat = halfSide / 111320;
            const dLng = halfSide / (111320 * Math.cos(lat * DEG_TO_RAD));

            const mX = lng - dLng;
            const MX = lng + dLng;
            const mY = lat - dLat;
            const MY = lat + dLat;

            minX = mX; maxX = MX; minY = mY; maxY = MY;

            // Clockwise ring for Outer
            points = [
                [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY], [minX, maxY]
            ];
        }

        // 4. Generate Buffers
        const shp = generateSHP(points, minX, minY, maxX, maxY);
        const shx = generateSHX(points, minX, minY, maxX, maxY, shp.length);
        const dbf = generateDBF();
        const prj = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';

        // 5. ZIP and Send
        res.attachment('polygon.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.append(shp, { name: 'polygon.shp' });
        archive.append(shx, { name: 'polygon.shx' });
        archive.append(dbf, { name: 'polygon.dbf' });
        archive.append(prj, { name: 'polygon.prj' });
        archive.finalize();

    } catch (err) {
        console.error('[Generator] Critical Error:', err);
        res.status(500).json({ error: err.message || 'Server Generation Failed' });
    }
});

// Export Image - Deduct 2 tokens
router.post('/export-image', verifyUser, async (req, res) => {
    const user_id = req.user.id;

    try {
        // 1. Check tokens
        const { data: user } = await req.supabase.from('users').select('token_balance').eq('id', user_id).single();
        if (!user || user.token_balance < 2) return res.status(403).json({ error: 'Insufficient tokens (need 2)' });

        // 2. Deduct tokens
        const newBalance = user.token_balance - 2;
        const { error } = await supabase.from('users').update({ token_balance: newBalance }).eq('id', user_id);
        if (error) throw error;

        res.json({ success: true, newBalance, message: 'Export authorized, 2 tokens deducted' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Server Generation Failed' });
    }
});

// Generate PDF - Deduct 5 tokens
router.post('/create-pdf', verifyUser, async (req, res) => {
    const { lat, lng, area, customPoints, mapImage, projectedPoints } = req.body;
    const user_id = req.user.id;

    if ((!lat || !lng || !area) && !customPoints) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const formattedLat = (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) ? parseFloat(lat).toFixed(7) : '-';
    const formattedLng = (lng !== undefined && lng !== null && !isNaN(parseFloat(lng))) ? parseFloat(lng).toFixed(7) : '-';

    try {
        console.log(`[Generator-PDF] Request from User: ${user_id}`);

        // 1. Check tokens
        const { data: user, error: userError } = await supabase.from('users').select('token_balance').eq('id', user_id).single();

        if (userError) throw new Error('Database error fetching user');
        if (!user || user.token_balance < 5) return res.status(403).json({ error: 'Insufficient tokens' });

        // 2. Deduct tokens
        const { error: updateError } = await supabase.from('users').update({ token_balance: user.token_balance - 5 }).eq('id', user_id);
        if (updateError) throw updateError;

        // 3. Generate PDF (A4 Landscape layout)
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_geospasial_${Date.now()}.pdf`);
        doc.pipe(res);

        // --- CLEAN SIMPLE LAYOUT ---
        // A4 Landscape is 841.89 x 595.28
        
        // Header
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(16).text('Laporan Digitasi Geospasial', 30, 30);
        doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('Generated by LineSima System', 30, 50);
        
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10).text('Luas Lahan: ', 600, 30, { align: 'right' });
        doc.font('Helvetica').text(`${area} m²`, 600, 45, { align: 'right' });

        doc.moveTo(30, 70).lineTo(811.89, 70).lineWidth(1).strokeColor('#cbd5e1').stroke();

        // Left Side: MAP
        const mapStartX = 30;
        const mapStartY = 90;
        const mapWidth = 460;
        const mapHeight = 460;
        
        doc.rect(mapStartX, mapStartY, mapWidth, mapHeight).lineWidth(1).strokeColor('#94a3b8').stroke();

        if (mapImage) {
            try {
                const base64Data = mapImage.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const img = doc.openImage(imageBuffer);
                
                const boxW = mapWidth - 2;
                const boxH = mapHeight - 2;
                const ratio = Math.max(boxW / img.width, boxH / img.height);
                const drawW = img.width * ratio;
                const drawH = img.height * ratio;
                const offsetX = mapStartX + 1 + (boxW - drawW) / 2;
                const offsetY = mapStartY + 1 + (boxH - drawH) / 2;
                
                doc.save();
                doc.rect(mapStartX + 1, mapStartY + 1, boxW, boxH).clip();
                doc.image(img, offsetX, offsetY, { width: drawW, height: drawH });
                doc.restore();
                
                // Plot Vector Polygon
                if (projectedPoints && projectedPoints.length > 0) {
                    doc.save();
                    doc.rect(mapStartX + 1, mapStartY + 1, boxW, boxH).clip();
                    
                    const plottedCoords = projectedPoints.map(pt => [offsetX + (pt.x_pct * drawW), offsetY + (pt.y_pct * drawH)]);

                    // Polygon Style
                    doc.lineWidth(2).strokeColor('#ef4444');
                    plottedCoords.forEach((pt, idx) => idx === 0 ? doc.moveTo(pt[0], pt[1]) : doc.lineTo(pt[0], pt[1]));
                    doc.closePath().fillOpacity(0.2).fillColor('#ef4444').fill();
                    
                    plottedCoords.forEach((pt, idx) => idx === 0 ? doc.moveTo(pt[0], pt[1]) : doc.lineTo(pt[0], pt[1]));
                    doc.closePath().strokeOpacity(1.0).strokeColor('#ef4444').stroke();

                    // Vertices
                    plottedCoords.forEach((pt, idx) => {
                        doc.circle(pt[0], pt[1], 4).lineWidth(1.5).strokeColor('#ef4444').fillOpacity(1.0).fillColor('#ffffff').fillAndStroke();
                        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10).text(`${idx + 1}`, pt[0] + 6, pt[1] - 10);
                    });
                    doc.restore();
                }
            } catch (imgErr) {
                doc.fillColor('#ef4444').text('Gagal memuat visualisasi peta satelit.', mapStartX + 20, mapStartY + 20);
            }
        }

        // Right Side: TABLE
        const tableStartX = 510;
        const tableStartY = 90;
        const tableWidth = 300;
        
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text('Daftar Titik Koordinat', tableStartX, tableStartY);
        
        const tTop = tableStartY + 20;
        doc.rect(tableStartX, tTop, tableWidth, 20).fillColor('#f1f5f9').fill();
        doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
        doc.text('NO', tableStartX + 5, tTop + 6);
        doc.text('LONGITUDE (X)', tableStartX + 40, tTop + 6);
        doc.text('LATITUDE (Y)', tableStartX + 150, tTop + 6);
        doc.text('STATUS', tableStartX + 250, tTop + 6);
        
        doc.moveTo(tableStartX, tTop + 20).lineTo(tableStartX + tableWidth, tTop + 20).lineWidth(1).strokeColor('#cbd5e1').stroke();

        let coordsList = [];
        if (customPoints && Array.isArray(customPoints) && customPoints.length > 0) {
            coordsList = customPoints;
        } else if (lat && lng && area) {
            const sideMeters = Math.sqrt(area);
            const dLatVal = (sideMeters / 2) / 111320;
            const dLngVal = (sideMeters / 2) / (111320 * Math.cos(parseFloat(lat) * Math.PI / 180));
            const nLat = parseFloat(lat);
            const nLng = parseFloat(lng);
            coordsList = [
                [nLng - dLngVal, nLat + dLatVal],
                [nLng + dLngVal, nLat + dLatVal],
                [nLng + dLngVal, nLat - dLatVal],
                [nLng - dLngVal, nLat - dLatVal]
            ];
        }

        doc.font('Helvetica').fontSize(8);
        let rowY = tTop + 20;
        const maxDisplay = 20; // Fit more rows since it's a clean layout
        const displayCoords = coordsList.slice(0, maxDisplay);
        
        displayCoords.forEach((p, idx) => {
            if (idx % 2 === 1) doc.rect(tableStartX, rowY, tableWidth, 18).fillColor('#f8fafc').fill();
            
            doc.fillColor('#475569');
            doc.text(`${idx + 1}`, tableStartX + 5, rowY + 5);
            doc.text(`${p[0].toFixed(7)}`, tableStartX + 40, rowY + 5);
            doc.text(`${p[1].toFixed(7)}`, tableStartX + 150, rowY + 5);
            doc.fillColor('#16a34a').text('Valid', tableStartX + 250, rowY + 5);
            
            rowY += 18;
        });

        if (coordsList.length > maxDisplay) {
            doc.fillColor('#64748b').font('Helvetica-Oblique').text(`... dan ${coordsList.length - maxDisplay} titik lainnya.`, tableStartX + 5, rowY + 5);
        }
        
        doc.rect(tableStartX, tTop, tableWidth, rowY - tTop).lineWidth(1).strokeColor('#e2e8f0').stroke();

        doc.end();

    } catch (err) {
        console.error('[PDF-Generator] Server Error:', err);
        res.status(500).json({ error: err.message || 'Server Generation Failed' });
    }
});

router.get('/proxy-tile', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL');
    try {
        const fetchReq = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        if (!fetchReq.ok) return res.status(fetchReq.status).send('Error');
        const arrayBuffer = await fetchReq.arrayBuffer();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', fetchReq.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=864000');
        res.send(Buffer.from(arrayBuffer));
    } catch (err) {
        res.status(500).send('Error Proxying Tile');
    }
});

module.exports = router;
