#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const iconsDir = path.join(__dirname, '..', 'src', '_includes', 'icons');
const assetsDir = path.join(__dirname, '..', 'src', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// SVG logo sources - using Wikipedia Commons and other reliable sources
const logoSources = {
    nytimes: 'https://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.svg',
    cnn: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/CNN.svg',
    foxnews: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Fox_News_Channel_logo.svg',
    reuters: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Reuters_Logo.svg',
    apnews: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Associated_Press_logo_2012.svg',
    cnbc: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg'
};

// Fallback SVGs in case downloads fail
const fallbackSVGs = {
    nytimes: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <rect x="10" y="20" width="80" height="60" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="35" x2="80" y2="35" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="45" x2="80" y2="45" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="55" x2="60" y2="55" stroke="currentColor" stroke-width="1"/>
        <text x="50" y="15" text-anchor="middle" font-size="8" font-family="serif">NYT</text>
    </svg>`,
    cnn: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="3" fill="none"/>
        <text x="50" y="55" text-anchor="middle" font-size="20" font-weight="bold">CNN</text>
    </svg>`,
    foxnews: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <rect x="10" y="20" width="80" height="60" rx="5" fill="currentColor"/>
        <text x="50" y="55" text-anchor="middle" font-size="14" fill="white" font-weight="bold">FOX</text>
    </svg>`,
    reuters: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="25" cy="50" r="8" fill="currentColor"/>
        <circle cx="50" cy="50" r="8" fill="currentColor"/>
        <circle cx="75" cy="50" r="8" fill="currentColor"/>
        <text x="50" y="75" text-anchor="middle" font-size="10">REUTERS</text>
    </svg>`,
    apnews: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <rect x="10" y="30" width="80" height="40" fill="currentColor"/>
        <text x="50" y="55" text-anchor="middle" font-size="18" fill="white" font-weight="bold">AP</text>
    </svg>`,
    cnbc: `<svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
        <rect x="10" y="35" width="80" height="30" fill="currentColor"/>
        <text x="50" y="55" text-anchor="middle" font-size="12" fill="white" font-weight="bold">CNBC</text>
    </svg>`
};

function downloadSVG(url, filename) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading ${filename} from ${url}...`);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                console.log(`Failed to download ${filename}: ${response.statusCode}`);
                resolve(null); // Don't reject, use fallback instead
                return;
            }

            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                console.log(`Successfully downloaded ${filename}`);
                resolve(data);
            });
        }).on('error', (err) => {
            console.log(`Error downloading ${filename}:`, err.message);
            resolve(null); // Don't reject, use fallback instead
        });
    });
}

function processSVG(svgContent, logoName) {
    if (!svgContent) {
        console.log(`Using fallback SVG for ${logoName}`);
        return fallbackSVGs[logoName];
    }

    // Clean up the SVG but preserve original colors and styling
    let cleaned = svgContent
        // Remove XML declaration and comments
        .replace(/^<\?xml[^>]*\?>/, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        // Ensure proper dimensions for 12x12px display
        .replace(/width="[^"]*"/, 'width="12"')
        .replace(/height="[^"]*"/, 'height="12"')
        .trim();

    return cleaned;
}

function createLiquidTemplate(svgContent, logoName) {
    // Simply return the processed SVG content as the Liquid template
    return svgContent;
}

async function downloadAllLogos() {
    console.log('Starting logo download process...');
    
    for (const [logoName, url] of Object.entries(logoSources)) {
        try {
            const svgContent = await downloadSVG(url, logoName);
            
            if (svgContent) {
                // Process the SVG with proper sizing while preserving brand colors
                const processedSVG = processSVG(svgContent, logoName);
                
                // Create Liquid template with the processed SVG
                const liquidFilePath = path.join(iconsDir, `${logoName}.liquid`);
                fs.writeFileSync(liquidFilePath, processedSVG);
                console.log(`Created ${logoName}.liquid with official branding`);
            } else {
                // Use fallback for failed downloads
                const liquidFilePath = path.join(iconsDir, `${logoName}.liquid`);
                fs.writeFileSync(liquidFilePath, fallbackSVGs[logoName]);
                console.log(`Created fallback ${logoName}.liquid`);
            }
            
        } catch (error) {
            console.error(`Failed to process ${logoName}:`, error);
            // Write fallback
            const liquidFilePath = path.join(iconsDir, `${logoName}.liquid`);
            fs.writeFileSync(liquidFilePath, fallbackSVGs[logoName]);
            console.log(`Created fallback ${logoName}.liquid`);
        }
    }

    // Create generic fallback icon
    const genericIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
    </svg>`;
    
    const genericFilePath = path.join(iconsDir, 'generic-news.liquid');
    fs.writeFileSync(genericFilePath, genericIcon);
    console.log('Created generic-news.liquid');

    console.log('Logo download process completed!');
}

// Run the download process
downloadAllLogos().catch(console.error);