const fs = require('fs');
const path = require('path');

/**
 * Reads all files from the images directory and returns their relative paths
 * @returns {string[]} Array of relative file paths from the images directory
 */
function readDir() {
    const imagesDir = path.join(__dirname, 'images');
    
    try {
        // Check if directory exists
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir);
        }
        
        // Read all files from the directory
        const files = fs.readdirSync(imagesDir);
        
        // Filter and map to relative paths
        return files
            .filter(file => {
                const filePath = path.join(imagesDir, file);
                return fs.statSync(filePath).isFile();
            })
            .map(file => path.join('images', file));
            
    } catch (error) {
        console.error('Error reading images directory:', error);
        return [];
    }
}

module.exports = {
    readDir
};
