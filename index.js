const texturePacker = require('free-tex-packer-core');
const fs = require('fs');
const path = require('path');
const { readDir } = require('./utils');

const brazenOrb = true

const exportPath = brazenOrb ? "C:/Users/defia/Documents/game dev/neutrino bitmasked/src/assets/images": "C:/Users/defia/Documents/game dev/2.5D/src/assets/texatlas/rocky_desert";

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
    files.forEach(item => {
        // Handle the image file
        if (item.name.endsWith('.png')) {
            fs.writeFileSync(
                path.join(exportPath, 'texatlas.png'),
                item.buffer
            );
            console.log(`Generated atlas with calculated width: ${targetWidth}`);
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