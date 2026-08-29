/**
 * Helper to generate valid ESRI Shapefile binary buffers (SHP, SHX, DBF) on Server
 */

function generateSHP(points, minX, minY, maxX, maxY) {
  const numPoints = points.length;
  // Content size for Polygon record:
  // ShapeType (4) + Box (32) + NumParts (4) + NumPoints (4) + Parts (4 * 1) + Points (16 * numPoints)
  const contentByteLength = 4 + 32 + 4 + 4 + 4 + (16 * numPoints);
  const contentWordLength = contentByteLength / 2;
  const fileWordLength = 50 + 4 + contentWordLength; // 50 words header + 4 words record header + content

  const buffer = Buffer.alloc(fileWordLength * 2);

  // --- SHP HEADER (100 bytes) ---
  buffer.writeInt32BE(9994, 0); // File Code
  buffer.writeInt32BE(fileWordLength, 24); // File Length in 16-bit words
  buffer.writeInt32LE(1000, 28); // Version
  buffer.writeInt32LE(5, 32); // Shape Type: Polygon (5)

  buffer.writeDoubleLE(minX, 36);
  buffer.writeDoubleLE(minY, 44);
  buffer.writeDoubleLE(maxX, 52);
  buffer.writeDoubleLE(maxY, 60);

  // --- RECORD HEADER (8 bytes) ---
  let offset = 100;
  buffer.writeInt32BE(1, offset); // Record Number
  buffer.writeInt32BE(contentWordLength, offset + 4);
  offset += 8;

  // --- RECORD CONTENT ---
  buffer.writeInt32LE(5, offset); offset += 4; // Shape Type: Polygon
  buffer.writeDoubleLE(minX, offset); offset += 8;
  buffer.writeDoubleLE(minY, offset); offset += 8;
  buffer.writeDoubleLE(maxX, offset); offset += 8;
  buffer.writeDoubleLE(maxY, offset); offset += 8;

  buffer.writeInt32LE(1, offset); offset += 4; // NumParts
  buffer.writeInt32LE(numPoints, offset); offset += 4; // NumPoints
  buffer.writeInt32LE(0, offset); offset += 4; // Parts[0] = 0

  for (let i = 0; i < numPoints; i++) {
    buffer.writeDoubleLE(points[i][0], offset); offset += 8; // X
    buffer.writeDoubleLE(points[i][1], offset); offset += 8; // Y
  }

  return buffer;
}

function generateSHX(points, minX, minY, maxX, maxY) {
  const numPoints = points.length;
  const contentByteLength = 4 + 32 + 4 + 4 + 4 + (16 * numPoints);
  const contentWordLength = contentByteLength / 2;
  const fileWordLength = 50 + 4; // 100 bytes header + 8 bytes (1 record) = 108 bytes = 54 words

  const buffer = Buffer.alloc(fileWordLength * 2);

  // Header
  buffer.writeInt32BE(9994, 0);
  buffer.writeInt32BE(fileWordLength, 24);
  buffer.writeInt32LE(1000, 28);
  buffer.writeInt32LE(5, 32); // Shape Type: Polygon

  buffer.writeDoubleLE(minX, 36);
  buffer.writeDoubleLE(minY, 44);
  buffer.writeDoubleLE(maxX, 52);
  buffer.writeDoubleLE(maxY, 60);

  // Record 1 Index
  buffer.writeInt32BE(50, 100); // Record offset (in words) = 50
  buffer.writeInt32BE(contentWordLength, 104);

  return buffer;
}

function generateDBF(fieldsData = { ID: 1, NAME: 'Land Parcel' }) {
  // dBASE III format with ID field
  const headerLength = 32 + 32 + 1; // 32 bytes main header + 32 bytes for 1 field + 0x0D
  const recordLength = 1 + 10; // 1 space + 10 char ID field
  const totalLength = headerLength + recordLength + 1; // + 0x1A EOF

  const buffer = Buffer.alloc(totalLength);

  const now = new Date();
  buffer.writeUInt8(0x03, 0); // dBASE III
  buffer.writeUInt8(now.getFullYear() - 1900, 1);
  buffer.writeUInt8(now.getMonth() + 1, 2);
  buffer.writeUInt8(now.getDate(), 3);
  buffer.writeUInt32LE(1, 4); // 1 Record
  buffer.writeUInt16LE(headerLength, 8);
  buffer.writeUInt16LE(recordLength, 10);

  // Field Descriptor: "ID"
  const fieldName = "ID\0\0\0\0\0\0\0\0\0";
  buffer.write(fieldName, 32, 11, 'ascii');
  buffer.write('N', 43, 1, 'ascii'); // Numeric
  buffer.writeUInt8(10, 48); // Field Length
  buffer.writeUInt8(0, 49); // Decimals

  // Header Terminator
  buffer.writeUInt8(0x0D, 64);

  // Record Data
  let offset = 65;
  buffer.write(' ', offset, 1, 'ascii'); // Record valid flag
  offset += 1;
  const valStr = String(fieldsData.ID || 1).padStart(10, ' ');
  buffer.write(valStr, offset, 10, 'ascii');
  offset += 10;

  // EOF
  buffer.writeUInt8(0x1A, offset);

  return buffer;
}

module.exports = {
  generateSHP,
  generateSHX,
  generateDBF
};
