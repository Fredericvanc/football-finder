#!/bin/bash

# Create a temporary directory
mkdir -p temp

# Download the football icon from a reliable source (using a free-to-use soccer ball icon)
curl -L "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26bd.svg" -o temp/football.svg

# Convert SVG to ICO format with multiple sizes (requires ImageMagick)
convert -background none temp/football.svg -define icon:auto-resize=64,32,16 public/favicon.ico

# Also save as SVG for modern browsers
cp temp/football.svg public/favicon.svg

# Clean up
rm -rf temp

echo "Favicon has been updated!"
