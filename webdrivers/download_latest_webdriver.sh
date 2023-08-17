#!/bin/bash

# Get the operating system
OS=$(uname -s)

# Get the machine architecture
ARCH=$(uname -m)

# Default architecture
ARCHITECTURE=""

# Check for Linux x86_64
if [ "$OS" = "Linux" ] && [ "$ARCH" = "x86_64" ]; then
    ARCHITECTURE="linux64"
# Check for Mac Intel
elif [ "$OS" = "Darwin" ] && [ "$ARCH" = "x86_64" ]; then
    ARCHITECTURE="mac64"
# Check for Mac Apple Silicon
elif [ "$OS" = "Darwin" ] && [ "$ARCH" = "arm64" ]; then
    ARCHITECTURE="mac_arm64"
else
    echo "Unsupported architecture"
    exit 1
fi

LATEST_CHROMIUM_WEBDRIVER_VERSION=`curl https://chromedriver.storage.googleapis.com/LATEST_RELEASE`
LATEST_WEBDRIVER_URL="https://chromedriver.storage.googleapis.com/${LATEST_CHROMIUM_WEBDRIVER_VERSION}/chromedriver_${ARCHITECTURE}.zip"
curl -OJ "${LATEST_WEBDRIVER_URL}"
ZIPFILE=$(ls | grep -E '.zip' | grep 'chromedriver')
unzip $ZIPFILE -d tmp
cp ./tmp/chromedriver ./
rm -rf tmp
rm -f $ZIPFILE
