const fs = require('fs');
const path = require('path');

/**
 * Recursively reads all image files from the images directory and its subdirectories
 * @returns {string[]} Array of relative file paths from the images directory
 */
function readDir(dir = 'images') {
    const fullPath = path.join(__dirname, dir);
    let results = [];
    
    try {
        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            return [];
        }
        
        // Read all files from the directory
        const files = fs.readdirSync(fullPath);
        
        // Process each file/directory
        files.forEach(file => {
            const filePath = path.join(fullPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Recursively read subdirectories
                const subResults = readDir(path.join(dir, file));
                results = results.concat(subResults);
            } else if (stat.isFile()) {
                // Check if file is an image
                const ext = path.extname(file).toLowerCase();
                if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
                    results.push(path.join(dir, file));
                }
            }
        });
            
    } catch (error) {
        console.error('Error reading directory:', error);
    }
    
    return results;
}

module.exports = {
    readDir
};
