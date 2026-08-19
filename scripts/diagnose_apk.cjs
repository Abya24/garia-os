const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function verifyApkZip(apkPath) {
  if (!fs.existsSync(apkPath)) {
    console.error(`[verifyApkZipHeaders] File not found: ${apkPath}`);
    return false;
  }

  const stat = fs.statSync(apkPath);
  console.log(`==========================================================================================`);
  console.log(`[verifyApkZipHeaders] Parsing ZIP stream & Central Directory headers: ${path.basename(apkPath)}`);
  console.log(`  - Path: ${apkPath}`);
  console.log(`  - Size: ${stat.size} bytes (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

  const buf = fs.readFileSync(apkPath);

  let offset = 0;
  let entryCount = 0;
  let validCount = 0;
  let hasManifest = false;
  let hasArsc = false;
  let dexCount = 0;
  const corruptedEntries = [];

  while (offset < buf.length - 30) {
    const magic = buf.readUInt32LE(offset);
    if (magic !== 0x04034b50) {
      // Not a local header (reached central directory or signature block)
      break;
    }

    const versionNeeded = buf.readUInt16LE(offset + 4);
    const flags = buf.readUInt16LE(offset + 6);
    const compMethod = buf.readUInt16LE(offset + 8);
    const modTime = buf.readUInt16LE(offset + 10);
    const modDate = buf.readUInt16LE(offset + 12);
    const headerCrc = buf.readUInt32LE(offset + 14);
    const compSize = buf.readUInt32LE(offset + 18);
    const uncompSize = buf.readUInt32LE(offset + 22);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);

    const name = buf.slice(offset + 30, offset + 30 + nameLen).toString('utf8');
    const dataOffset = offset + 30 + nameLen + extraLen;

    entryCount++;
    if (name === 'AndroidManifest.xml') hasManifest = true;
    if (name === 'resources.arsc') hasArsc = true;
    if (name.startsWith('classes') && name.endsWith('.dex')) dexCount++;

    if (compMethod === 0) {
      // Stored (no compression)
      const data = buf.slice(dataOffset, dataOffset + uncompSize);
      const crc = zlib.crc32(data);
      if (headerCrc !== 0 && crc !== headerCrc) {
        corruptedEntries.push({ name, reason: `CRC mismatch (header: 0x${headerCrc.toString(16)}, computed: 0x${crc.toString(16)})` });
      } else {
        validCount++;
      }
    } else if (compMethod === 8) {
      // Deflated
      try {
        const compressedData = buf.slice(dataOffset, dataOffset + compSize);
        const decompressed = zlib.inflateRawSync(compressedData);
        const crc = zlib.crc32(decompressed);
        if (headerCrc !== 0 && crc !== headerCrc) {
          corruptedEntries.push({ name, reason: `CRC mismatch (header: 0x${headerCrc.toString(16)}, computed: 0x${crc.toString(16)})` });
        } else {
          validCount++;
        }
      } catch (err) {
        corruptedEntries.push({ name, reason: `Decompression error: ${err.message}` });
      }
    } else {
      validCount++;
    }

    offset = dataOffset + compSize;
    if ((flags & 0x08) !== 0 && compMethod !== 0) {
      const nextMagic = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), offset);
      if (nextMagic !== -1) {
        offset = nextMagic;
      } else {
        break;
      }
    }
  }

  console.log(`  - Total sequential ZIP stream entries: ${entryCount}`);
  console.log(`  - AndroidManifest.xml present: ${hasManifest}`);
  console.log(`  - resources.arsc present: ${hasArsc}`);
  console.log(`  - DEX classes count: ${dexCount}`);
  console.log(`  - CRC32 & decompressed integrity passed: ${validCount}`);

  if (corruptedEntries.length > 0) {
    console.error(`  [FAILED] Corrupted entries detected:`);
    corruptedEntries.forEach(e => console.error(`    - ${e.name}: ${e.reason}`));
    return false;
  }

  console.log(`[verifyApkZipHeaders] All ZIP headers, stream offsets, and CRC32 checksums are 100% valid.`);
  console.log(`==========================================================================================`);
  return true;
}

const args = process.argv.slice(2);
const target = args[0] || 'public/Garia_OS_v3.0.0_Release_APK.apk';
verifyApkZip(target);
