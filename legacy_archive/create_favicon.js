const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'Final Dripp/logos/Dripp Media Logo yellow with trans bg with media (1).png');
const outputPath = path.join(__dirname, 'favicon.png');

async function createFavicon() {
    try {
        // Read and resize the logo to fit within the favicon size (e.g., 400x400 to give some padding in 512x512)
        const logoBuffer = await sharp(inputPath)
            .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // Create the 512x512 black background and composite the resized logo
        await sharp({
            create: {
                width: 512,
                height: 512,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
            }
        })
        .composite([{
            input: logoBuffer,
            gravity: 'center'
        }])
        .png()
        .toFile(outputPath);
        
        console.log('Successfully created favicon.png with black background');
    } catch (err) {
        console.error('Error creating favicon:', err);
    }
}

createFavicon();
