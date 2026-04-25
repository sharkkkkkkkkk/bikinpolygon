const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const archiver = require('archiver');

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
        const { error } = await req.supabase.from('users').update({ token_balance: newBalance }).eq('id', user_id);
        if (error) throw error;

        res.json({ success: true, newBalance, message: 'Export authorized, 2 tokens deducted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function generateSHP(points, minX, minY, maxX, maxY) {
    // Record Content Calculation
    const numPoints = points.length;
    const numParts = 1;
    // Content = ShapeType(4) + Box(32) + NumParts(4) + NumPoints(4) + Parts(4*NumParts) + Points(16*NumPoints)
    // 4 + 32 + 4 + 4 + 4 + 16*5 = 48 + 80 = 128 bytes
    const contentLenBytes = 44 + (4 * numParts) + (16 * numPoints);
    const recordLenWords = contentLenBytes / 2;
    const fileLenWords = 50 + 4 + recordLenWords; // Header(50 words) + RecHeader(4 words) + Content
    const fileLenBytes = fileLenWords * 2;

    const buf = Buffer.alloc(fileLenBytes);

    // --- File Header (100 bytes) ---
    buf.writeInt32BE(9994, 0); // File Code
    // Unused 4-23 is 0
    buf.writeInt32BE(fileLenWords, 24); // File Length (words)
    buf.writeInt32LE(1000, 28); // Version
    buf.writeInt32LE(5, 32); // Shape Type (5=Polygon)
    buf.writeDoubleLE(minX, 36);
    buf.writeDoubleLE(minY, 44);
    buf.writeDoubleLE(maxX, 52);
    buf.writeDoubleLE(maxY, 60);
    // Z/M range 0

    // --- Record Header ---
    let pos = 100;
    buf.writeInt32BE(1, pos); // Rec Number
    buf.writeInt32BE(recordLenWords, pos + 4); // Content Length (words)
    pos += 8;

    // --- Record Content ---
    buf.writeInt32LE(5, pos); // Shape Type
    pos += 4;
    buf.writeDoubleLE(minX, pos);
    buf.writeDoubleLE(minY, pos + 8);
    buf.writeDoubleLE(maxX, pos + 16);
    buf.writeDoubleLE(maxY, pos + 24);
    pos += 32;
    buf.writeInt32LE(numParts, pos); // NumParts
    pos += 4;
    buf.writeInt32LE(numPoints, pos); // NumPoints
    pos += 4;
    buf.writeInt32LE(0, pos); // Parts[0] index
    pos += 4;

    for (let p of points) {
        buf.writeDoubleLE(p[0], pos);     // X
        buf.writeDoubleLE(p[1], pos + 8); // Y
        pos += 16;
    }

    return buf;
}

function generateSHX(points, minX, minY, maxX, maxY, shpLenBytes) {
    // Header (100 bytes) + 1 Record (8 bytes)
    // File Len = 50 + 4 = 54 words
    const buf = Buffer.alloc(100 + 8);

    // Header COPY from SHP mostly, but length changes
    buf.writeInt32BE(9994, 0);
    buf.writeInt32BE(54, 24); // Length in words
    buf.writeInt32LE(1000, 28);
    buf.writeInt32LE(5, 32);
    buf.writeDoubleLE(minX, 36);
    buf.writeDoubleLE(minY, 44);
    buf.writeDoubleLE(maxX, 52);
    buf.writeDoubleLE(maxY, 60);

    // Record
    // Offset (words), Content Length (words)
    // First record in SHP starts at 100. 100/2 = 50.
    const offset = 50;
    // Content Length same as SHP calculation
    const numPoints = points.length;
    const contentLenBytes = 44 + (4 * 1) + (16 * numPoints);
    const contentLenWords = contentLenBytes / 2;

    buf.writeInt32BE(offset, 100);
    buf.writeInt32BE(contentLenWords, 104);

    return buf;
}

function generateDBF() {
    // Minimal DBF with 1 field "ID"
    // Header (32) + 1 Field (32) + Term (1) + Record (11) + EOF (1) = 77
    const buf = Buffer.alloc(77);

    // Header
    buf.writeUInt8(0x03, 0); // Version (dBASE III)
    const now = new Date();
    buf.writeUInt8(now.getFullYear() - 1900, 1);
    buf.writeUInt8(now.getMonth() + 1, 2);
    buf.writeUInt8(now.getDate(), 3);
    buf.writeUInt32LE(1, 4); // Num Records
    buf.writeUInt16LE(32 + 32 + 1, 8); // Header Length
    buf.writeUInt16LE(11, 10); // Record Length

    // Field Descriptor
    buf.write("ID", 32); // Name
    buf.writeUInt8(0x4E, 32 + 11); // Type 'N' (Numeric)
    buf.writeUInt8(10, 32 + 16); // Length
    buf.writeUInt8(0, 32 + 17); // Decimal

    // Header Terminator
    buf.writeUInt8(0x0D, 64);

    // Record 1
    buf.write(" ", 65); // Deletion Flag (Space = Active)
    buf.write("1", 66); // ID Value (padded with spaces implicitly or we write explicitly?)
    // Buffer default 0, but text fields usually space padded. N fields are text representation usually.
    // "1" followed by spaces or spaces then "1". simple is fine.

    // EOF
    buf.writeUInt8(0x1A, 76);

    return buf;
}

module.exports = router;
