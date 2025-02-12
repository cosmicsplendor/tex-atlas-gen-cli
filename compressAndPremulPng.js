const fs = require('fs');
const sharp = require('sharp');

async function processImage(inputPath, outputPath) {
    try {
        // 1. Load the image and ensure it has an alpha channel
        const image = sharp(inputPath).ensureAlpha();

        // 2. Get image metadata
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;
        const channels = metadata.channels;  // Important: Check the number of channels

        if (channels < 4) {
            console.warn("Input image does not have an alpha channel. Output will be identical, but lossless compressed.");
            // Just do lossless compression in this case.
             const pngBuffer = await sharp(inputPath)
                .png({  compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true }) // Maximum lossless compression.  Adjust these.
                .toBuffer();
            fs.writeFileSync(outputPath, pngBuffer);
            console.log('Image processed (lossless) and saved to', outputPath);
            return;
        }



        // 3. Extract raw pixel data (RGBA)
        const rawBuffer = await image.raw().toBuffer();

        // 4. Premultiply alpha
        for (let i = 0; i < rawBuffer.length; i += channels) {
            const alpha = rawBuffer[i + 3] / 255;  // Normalize alpha (0-1)
            rawBuffer[i + 0] = Math.min(255, Math.round(rawBuffer[i + 0] * alpha)); // Red
            rawBuffer[i + 1] = Math.min(255, Math.round(rawBuffer[i + 1] * alpha)); // Green
            rawBuffer[i + 2] = Math.min(255, Math.round(rawBuffer[i + 2] * alpha)); // Blue
            // Alpha channel is *not* modified
        }

        // 5. Create a new Sharp object from the premultiplied raw data
        const premultipliedImage = sharp(rawBuffer, {
            raw: {
                width: width,
                height: height,
                channels: channels // Use the original channel count
            }
        });

        // 6. Encode as a lossless PNG with optimized settings
        const pngBuffer = await premultipliedImage
            .png({  compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true }) // Maximum lossless compression.  Adjust these.
            .toBuffer();

        // 7. Save the result
        fs.writeFileSync(outputPath, pngBuffer);
        console.log('Image processed (premultiplied alpha and lossless) and saved to', outputPath);

    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Example usage
const inputFile = 'tex.png';  // Replace with your image
const outputFile = 'texatlas.png';
processImage(inputFile, outputFile);