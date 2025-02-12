const sharp = require('sharp');

const inputFile = 'tex.png';
const outputFile = 'texatlas.png';
const tempFile = 'temp_compressed.png';

async function compressAndPremultiplyImage() {
    try {
        // Step 1: Compress the original image first
        await sharp(inputFile)
            .png({
                compressionLevel: 9,
                adaptiveFiltering: true,
                palette: true,
                quality: 80,
                effort: 8,
                dither: 1.0
            })
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
                .png({
                    // Use minimal safe compression for final output to preserve premultiplication
                    compressionLevel: 9,
                    adaptiveFiltering: false,
                    palette: false,
                    dither: 0,
                    quality: 100
                })
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