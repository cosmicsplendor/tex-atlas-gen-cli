const texturePacker = require('free-tex-packer-core');
const fs = require('fs');
const path = require('path');
const { readDir } = require('./utils');
const sharp = require("sharp")

const brazenOrb = false

const exportPath = brazenOrb ? "C:/Users/defia/Documents/game dev/neutrino bitmasked/src/assets/images": "C:/Users/defia/Documents/game dev/pseudo3d/src/assets/texatlas";

if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
}

const imagePaths = readDir(brazenOrb ? "brazen orb" : "images");

const margin = { x: 1, y: 1 };
const images = [];
const rects = [];

imagePaths.forEach(imagePath => {
    const contents = fs.readFileSync(imagePath);
    images.push({ path: imagePath, contents });
    
    const width = contents.readUInt32BE(16);
    const height = contents.readUInt32BE(20);
    rects.push({ width, height });
});

// Calculate maximum dimensions needed
const maxWidth = Math.max(...rects.map(r => r.width));
const maxHeight = Math.max(...rects.map(r => r.height));
const totalArea = rects.reduce((acc, cur) => acc + (cur.width + margin.x) * (cur.height + margin.y), 0);

// Calculate dimensions that should fit all textures
const targetWidth = Math.max(maxWidth, Math.ceil(Math.sqrt(totalArea * 1.5)));
const targetHeight = Math.ceil(totalArea / targetWidth) + maxHeight;

const options = {
    fixedSize: true,
    width: targetWidth,
    height: targetHeight,
    padding: 1,
    allowRotation: false,
    detectIdentical: true,
    allowTrim: false,
    exporter: "JsonHash",
    removeFileExtension: true,
    prependFolderName: true,
};

// Pack images
texturePacker(images, options, (files) => {
    if (!files) return
    files.forEach(item => {
        // Handle the image file
        if (item.name.endsWith('.png')) {
            console.log("HERE")
            // Load the buffer into Sharp
            const image = sharp(item.buffer);
            
            // Extract the raw pixel data, premultiply alpha, and save back
            image
                .raw()
                .toBuffer({ resolveWithObject: true })
                .then(({ data, info }) => {
                    // Premultiply alpha for each pixel
                    for (let i = 0; i < data.length; i += 4) {
                        const alpha = data[i + 3] / 255;
                        data[i] = Math.round(data[i] * alpha);     // R
                        data[i + 1] = Math.round(data[i + 1] * alpha); // G
                        data[i + 2] = Math.round(data[i + 2] * alpha); // B
                    }
                    
                    // Convert back to PNG and save
                    return sharp(data, {
                        raw: {
                            width: info.width,
                            height: info.height,
                            channels: 4
                        }
                    })
                    .png()
                    .toBuffer();
                })
                .then(outputBuffer => {
                    fs.writeFileSync(
                        path.join(exportPath, 'texatlas.png'),
                        outputBuffer
                    );
                    console.log(`Generated premultiplied atlas with calculated width: ${targetWidth}`);
                })
                .catch(err => {
                    console.error('Error processing atlas:', err);
                });
        }
        // Handle the JSON file and transform it
        else if (item.name.endsWith('.json')) {
            const originalData = JSON.parse(item.buffer.toString());
            const transformedData = {};
            
            // Transform the data format
            Object.entries(originalData.frames).forEach(([key, value]) => {
                transformedData[path.basename(key)] = {
                    x: value.frame.x,
                    y: value.frame.y,
                    width: value.frame.w,
                    height: value.frame.h
                };
            });

            // Write the transformed data as a single line
            fs.writeFileSync(
                path.join(exportPath, 'atlasmeta.cson'),
                JSON.stringify(transformedData)
            );
        }
    });
    console.log('Texture atlas generated successfully!');
});