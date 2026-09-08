const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateSHP, generateSHX, generateDBF } = require('../utils/shpHelper');
const { calculateGeometryArea } = require('../services/authorizationService');

describe('ESRI Shapefile Binary Generator Tests (shpHelper.js)', () => {
    // Sample coordinates for a closed rectangular polygon in Jakarta (WGS84)
    // [ [lng, lat], ... ]
    const samplePoints = [
        [106.8456, -6.2088],
        [106.8466, -6.2088],
        [106.8466, -6.2078],
        [106.8456, -6.2078],
        [106.8456, -6.2088] // Closed loop
    ];
    const minX = 106.8456;
    const minY = -6.2088;
    const maxX = 106.8466;
    const maxY = -6.2078;

    it('should generate valid binary SHP buffer with correct header and polygon records', () => {
        const buffer = generateSHP(samplePoints, minX, minY, maxX, maxY);
        assert.ok(Buffer.isBuffer(buffer), 'Output must be a Buffer');
        assert.ok(buffer.length > 100, 'SHP buffer must be larger than 100 bytes header');

        // Verify File Code: 9994 (Big Endian at offset 0)
        const fileCode = buffer.readInt32BE(0);
        assert.strictEqual(fileCode, 9994, 'File Code must be 9994');

        // Verify Version: 1000 (Little Endian at offset 28)
        const version = buffer.readInt32LE(28);
        assert.strictEqual(version, 1000, 'Version must be 1000');

        // Verify Shape Type: 5 (Polygon) at offset 32 (Little Endian)
        const shapeType = buffer.readInt32LE(32);
        assert.strictEqual(shapeType, 5, 'Shape Type must be 5 (Polygon)');

        // Verify Bounding Box coordinates
        assert.strictEqual(buffer.readDoubleLE(36), minX, 'MinX must match');
        assert.strictEqual(buffer.readDoubleLE(44), minY, 'MinY must match');
        assert.strictEqual(buffer.readDoubleLE(52), maxX, 'MaxX must match');
        assert.strictEqual(buffer.readDoubleLE(60), maxY, 'MaxY must match');

        // Verify Record 1 Header: Record Number = 1 at offset 100
        const recordNumber = buffer.readInt32BE(100);
        assert.strictEqual(recordNumber, 1, 'Record Number 1 must be 1');

        // Verify Record Shape Type = 5 at offset 108
        const recordShapeType = buffer.readInt32LE(108);
        assert.strictEqual(recordShapeType, 5, 'Record shape type must be 5');
    });

    it('should generate valid binary SHX index buffer', () => {
        const buffer = generateSHX(samplePoints, minX, minY, maxX, maxY);
        assert.ok(Buffer.isBuffer(buffer), 'Output must be a Buffer');
        assert.strictEqual(buffer.length, 108, 'SHX for 1 record must be exactly 108 bytes (100 header + 8 index)');

        // Verify File Code: 9994 (Big Endian)
        assert.strictEqual(buffer.readInt32BE(0), 9994, 'File Code must be 9994');

        // Verify Shape Type: 5 (Polygon)
        assert.strictEqual(buffer.readInt32LE(32), 5, 'Shape Type must be 5');

        // Verify Record 1 Offset: 50 16-bit words (100 bytes)
        const offsetInWords = buffer.readInt32BE(100);
        assert.strictEqual(offsetInWords, 50, 'Offset for record 1 must be 50 words');
    });

    it('should generate valid dBASE III DBF table buffer', () => {
        const buffer = generateDBF({ ID: 101, NAME: 'Lahan Komersial' });
        assert.ok(Buffer.isBuffer(buffer), 'Output must be a Buffer');

        // Verify dBASE III magic byte at offset 0 (0x03)
        assert.strictEqual(buffer.readUInt8(0), 0x03, 'dBASE III version byte must be 0x03');

        // Verify Header length and Record length
        const headerLength = buffer.readUInt16LE(8);
        const recordLength = buffer.readUInt16LE(10);
        assert.strictEqual(headerLength, 65, 'Header length must be 65 bytes');
        assert.strictEqual(recordLength, 11, 'Record length must be 11 bytes');

        // Verify Header terminator 0x0D at offset 64
        assert.strictEqual(buffer.readUInt8(64), 0x0D, 'Header terminator must be 0x0D');

        // Verify Record valid flag at offset 65 (' ' = space)
        assert.strictEqual(buffer.toString('ascii', 65, 66), ' ', 'Record valid flag must be space');

        // Verify EOF marker 0x1A at the end
        assert.strictEqual(buffer.readUInt8(buffer.length - 1), 0x1A, 'EOF byte must be 0x1A');
    });
});

describe('Spatial Calculation & GeoJSON Area Tests (authorizationService.js)', () => {
    it('should calculate accurate area in m2 for standard polygon coordinates', () => {
        // Approximate 100m x 100m polygon near equator (~10,000 m2)
        const squarePoints = [
            [106.845000, -6.208000],
            [106.845904, -6.208000],
            [106.845904, -6.207096],
            [106.845000, -6.207096],
            [106.845000, -6.208000]
        ];

        const areaM2 = calculateGeometryArea(squarePoints);
        assert.ok(areaM2 > 9000 && areaM2 < 11000, `Calculated area ${areaM2} should be around 10,000 m2`);
    });

    it('should fallback to manual area when customPoints are not provided', () => {
        const areaM2 = calculateGeometryArea(null, null, null, 150.75);
        assert.strictEqual(areaM2, 150.75, 'Should return manual area when valid');
    });

    it('should return 0 when inputs are invalid', () => {
        const areaM2 = calculateGeometryArea(null, null, null, null);
        assert.strictEqual(areaM2, 0, 'Should return 0 for empty inputs');
    });
});
