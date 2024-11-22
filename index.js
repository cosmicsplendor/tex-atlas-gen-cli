const texturePacker = require('free-tex-packer-core');
const fs = require('fs');
const path = require('path');
const { readDir } = require('./utils');

const exportPath = "C:/Users/defia/Documents/game dev/2.5D/src/assets/texatlas/rocky_desert";

// Create export directory if it doesn't exist
if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
}

// Get image paths
const imagePaths = readDir();

// Prepare images and calculate dimensions
const margin = { x: 1, y: 1 }; // Using padding as margin
const images = [];
const rects = [];

// First pass: collect image data and dimensions
imagePaths.forEach(imagePath => {
    const contents = fs.readFileSync(imagePath);
    images.push({ path: imagePath, contents });
    
    // Get image dimensions using the buffer header
    // PNG header structure: https://www.w3.org/TR/PNG/#11IHDR
    const width = contents.readUInt32BE(16);
    const height = contents.readUInt32BE(20);
    rects.push({ width, height });
});

// Calculate optimal width using the heuristic
const totalArea = rects.reduce((acc, cur) => acc + (cur.width + margin.x) * (cur.height + margin.y), 0);
const containerWidth = Math.max(
    rects[0].width + margin.x,
    rects[0].height + margin.y,
    Math.round(Math.sqrt(totalArea * 1.1))
);

// Pack options
const options = {
    fixedSize: false,
    padding: 2,
    allowRotation: false,
    detectIdentical: true,
    allowTrim: true,
    exporter: "JsonHash",
    removeFileExtension: true,
    prependFolderName: true,
    width: containerWidth
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
            console.log(`Generated atlas with calculated width: ${containerWidth}`);
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