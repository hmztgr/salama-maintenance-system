#!/bin/bash

echo "🚀 Starting automated Netlify deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf out/
rm -f deployment.zip

# Build static export
echo "📦 Building static export..."
bun run build:static

# Check if build succeeded
if [ ! -d "out" ]; then
    echo "❌ Build failed - out directory not found"
    exit 1
fi

echo "✅ Build successful!"
echo "📁 Static files generated in './out' directory"
echo "📊 Build size:"
du -sh out/

# Create deployment zip
echo "🗜️ Creating deployment zip..."
cd out && zip -r ../deployment.zip . && cd ..

if [ -f "deployment.zip" ]; then
    echo "✅ Deployment zip created: deployment.zip"
    echo "📊 Zip size:"
    ls -lh deployment.zip
else
    echo "❌ Failed to create deployment zip"
    exit 1
fi

echo ""
echo "🎉 Deployment files ready!"
echo ""
echo "Manual deployment options:"
echo "1. Drag './out' folder to: https://app.netlify.com/drop"
echo "2. Upload 'deployment.zip' to: https://app.netlify.com/drop"
echo ""
echo "Automated deployment options:"
echo "1. Use Netlify CLI: netlify deploy --prod --dir=out"
echo "2. Connect Git repository to Netlify for auto-deployment"
echo ""
