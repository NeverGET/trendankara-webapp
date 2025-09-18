#!/bin/bash
# Script to create SSH tunnel to production database
# This allows local development with production database

echo "Creating SSH tunnel to production database..."
echo "The database will be available at localhost:3308"
echo "Press Ctrl+C to close the tunnel"

# Create SSH tunnel
# Local port 3308 -> Remote server -> Container port 3307
ssh -N -L 3308:localhost:3307 root@82.29.169.180

# -N: Don't execute remote command
# -L: Local port forwarding
# 3308: Local port (to avoid conflict with local MySQL)
# localhost:3307: Remote destination (MySQL on port 3307)