#!/bin/bash

# Create the public directory if it doesn't exist
mkdir -p public

# Download the video
curl -L "https://joy1.videvo.net/videvo_files/video/free/2014-12/large_watermarked/Football_Sequence_08_preview.mp4" -o "public/football-background.mp4"

echo "Video downloaded successfully!"
