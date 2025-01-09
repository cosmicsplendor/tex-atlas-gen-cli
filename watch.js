const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const brazenOrb = false
const imagesDir = path.join(__dirname, brazenOrb ? "brazen orb" : 'images');
let isProcessing = false;
let pendingRun = false;

// Function to run the packer
function runPacker() {
    if (isProcessing) {
        pendingRun = true;
        return;
    }

    console.log('\n🔄 Changes detected, repacking textures...');
    isProcessing = true;

    const process = spawn('node', ['index.js'], {
        stdio: 'inherit'
    });

    process.on('close', (code) => {
        isProcessing = false;
        if (pendingRun) {
            pendingRun = false;
            runPacker();
        } else {
            if (code === 0) {
                console.log('✅ Texture atlas updated successfully!\n');
            } else {
                console.log('❌ Error updating texture atlas\n');
            }
        }
    });
}

// Initialize watcher
const watcher = chokidar.watch(imagesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
});

// Add event listeners
watcher
    .on('add', path => {
        console.log(`File ${path} has been added`);
        runPacker();
    })
    .on('change', path => {
        console.log(`File ${path} has been changed`);
        runPacker();
    })
    .on('unlink', path => {
        console.log(`File ${path} has been removed`);
        runPacker();
    });

console.log(`👀 Watching for changes in ${imagesDir}...`);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nStopping watcher...');
    watcher.close().then(() => process.exit(0));
});
