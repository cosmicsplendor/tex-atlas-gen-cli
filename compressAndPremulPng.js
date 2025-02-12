const sharp = require('sharp');

const inputFile = 'tex.png';
const outputFile = 'texatlas.png';
const tempFile = 'temp_compressed.png';

const COMPRESSION = {
    aggressive: {
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true,
        quality: 80,
        effort: 8,
        dither: 1.0
    },
    minimal: {
        compressionLevel: 1,         // Much lighter compression
        adaptiveFiltering: false,    // Disabled to preserve more detail
        palette: false,              // Disabled to preserve original colors
        quality: 95,                 // Higher quality
        effort: 5,                   // Lower effort for lighter compression
        dither: 0                    // No dithering to preserve original colors
    },
    // Final compression after premultiplication
    preservePremultiplied: {
        // compressionLevel: 6,         // Moderate compression that preserves values
        // adaptiveFiltering: false,    // Disabled to preserve premultiplication
        // palette: false,              // Disabled to preserve exact values
        // dither: 0,                   // No dithering
        // quality: 100                 // Preserve premultiplied values
    }
}

const COMPRESSION_MODE = "minimal"

async function compressAndPremultiplyImage() {
    try {
        // Step 1: Compress the original image first
        await sharp(inputFile)
            .png(COMPRESSION[COMPRESSION_MODE])
            .toFile(tempFile);

        // Step 2: Load compressed image and premultiply
        const compressedImage = sharp(tempFile);
        
        await compressedImage
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                // Premultiply RGB channels with alpha
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3] / 255;
                    data[i] = Math.round(data[i] * alpha);     // R
                    data[i + 1] = Math.round(data[i + 1] * alpha); // G
                    data[i + 2] = Math.round(data[i + 2] * alpha); // B
                }
                
                // Create final image from premultiplied data
                return sharp(data, {
                    raw: {
                        width: info.width,
                        height: info.height,
                        channels: 4
                    }
                })
                .png(COMPRESSION.preservePremultiplied)
                .toFile(outputFile);
            });

        // Clean up temporary file
        const fs = require('fs');
        fs.unlinkSync(tempFile);
            
        console.log('Compression and premultiplication completed successfully');
        
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

compressAndPremultiplyImage();