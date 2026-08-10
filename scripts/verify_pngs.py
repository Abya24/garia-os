import glob
import os
import sys
import zlib
import struct

def verify_png_zlib(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
        if len(data) < 8 or data[:8] != b'\x89PNG\r\n\x1a\n':
            return False, 'Invalid PNG magic header'
        
        pos = 8
        idat_bytes = bytearray()
        ihdr_found = False
        iend_found = False
        width = height = 0
        bit_depth = color_type = 0
        
        while pos < len(data):
            if pos + 8 > len(data):
                return False, 'Truncated chunk header'
            length, chunk_type = struct.unpack('>I4s', data[pos:pos+8])
            pos += 8
            if pos + length + 4 > len(data):
                return False, 'Truncated chunk data'
            chunk_data = data[pos:pos+length]
            pos += length
            expected_crc, = struct.unpack('>I', data[pos:pos+4])
            pos += 4
            
            actual_crc = zlib.crc32(chunk_type + chunk_data) & 0xffffffff
            if actual_crc != expected_crc:
                return False, f'CRC mismatch in {chunk_type.decode("latin1", "ignore")}'
                
            if chunk_type == b'IHDR':
                ihdr_found = True
                width, height, bit_depth, color_type, comp, filter_m, interlace = struct.unpack('>IIBBBBB', chunk_data)
            elif chunk_type == b'IDAT':
                idat_bytes.extend(chunk_data)
            elif chunk_type == b'IEND':
                iend_found = True
                break
                
        if not ihdr_found or not iend_found:
            return False, 'Missing IHDR or IEND chunk'
            
        decompressed = zlib.decompress(bytes(idat_bytes))
        mode_str = f"color_type={color_type}, depth={bit_depth}"
        return True, f"{width}x{height}, mode=({mode_str}), decompressed_bytes={len(decompressed)}"
    except Exception as e:
        return False, f"Exception during validation: {e}"

def main():
    has_pil = False
    try:
        from PIL import Image
        has_pil = True
    except ImportError:
        pass

    search_dirs = ['android/app/src/main/res', 'public']
    png_files = []
    for s_dir in search_dirs:
        if os.path.exists(s_dir):
            png_files.extend(glob.glob(os.path.join(s_dir, '**/*.png'), recursive=True))

    print(f"==========================================")
    print(f" GARIA OS PNG ASSET VALIDATION ")
    print(f" Decoder: {'Pillow (PIL)' if has_pil else 'Native Python zlib/struct'}")
    print(f" Total PNG files found: {len(png_files)}")
    print(f"==========================================")

    failed = []
    for p in sorted(png_files):
        if has_pil:
            try:
                im = Image.open(p)
                im.verify()
                im = Image.open(p)
                im.load()
                print(f"✅ VALID [Pillow]: {p} ({im.size[0]}x{im.size[1]}, mode={im.mode})")
            except Exception as e:
                print(f"❌ INVALID [Pillow]: {p} - {e}")
                failed.append((p, str(e)))
        else:
            ok, msg = verify_png_zlib(p)
            if ok:
                print(f"✅ VALID [zlib]: {p} ({msg})")
            else:
                print(f"❌ INVALID [zlib]: {p} - {msg}")
                failed.append((p, msg))

    print(f"==========================================")
    print(f" SUMMARY: {len(png_files)-len(failed)} Passed | {len(failed)} Failed")
    print(f"==========================================")

    if failed:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
