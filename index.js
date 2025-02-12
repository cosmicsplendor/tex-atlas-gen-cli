const fs = require('fs');
const sharp = require('sharp');

async function processImage(inputPath, outputPath) {
    try {
        const image = sharp(inputPath).ensureAlpha();

        image
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                const channels = info.channels;

                if (channels < 4) {
                    console.warn("Input image does not have an alpha channel.");
                    return sharp(inputPath)
                        .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true })
                        .toBuffer();
                }

                // Correct Premultiplication (Handles Non-Premultiplied Input)
                for (let i = 0; i < data.length; i += channels) {
                    const alpha = data[i + 3] / 255;

                    // *CRITICAL FIX*: Check if alpha is zero.  If it is, set RGB to zero.
                    if (alpha === 0) {
                        data[i] = 0;     // R
                        data[i + 1] = 0; // G
                        data[i + 2] = 0; // B
                    } else {
                        // Only premultiply if alpha is NOT zero.
                        data[i] = Math.min(255, Math.round(data[i] * alpha));     // R
                        data[i + 1] = Math.min(255, Math.round(data[i + 1] * alpha)); // G
                        data[i + 2] = Math.min(255, Math.round(data[i + 2] * alpha)); // B
                    }
                }

                return sharp(data, {
                    raw: {
                        width: info.width,
                        height: info.height,
                        channels: channels
                    }
                })
                .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true })
                .toBuffer();
            })
            .then(pngBuffer => {
                fs.writeFileSync(outputPath, pngBuffer);
                console.log('Image processed and saved to', outputPath);
            })
            .catch(error => {
                console.error('Error processing image:', error);
            });

    } catch (error) {
        console.error('Error loading image:', error);
    }
}

const inputFile = 'tex.png'; // Replace with your actual file
const outputFile = 'texatlas.png';
processImage(inputFile, outputFile);