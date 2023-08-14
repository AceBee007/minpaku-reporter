LATEST_CHROMIUM_WEBDRIVER_VERSION=`curl https://chromedriver.storage.googleapis.com/LATEST_RELEASE`
LATEST_MAC_ARM64_WEBDRIVER_URL="https://chromedriver.storage.googleapis.com/${LATEST_CHROMIUM_WEBDRIVER_VERSION}/chromedriver_mac_arm64.zip"
curl -OJ "${LATEST_MAC_ARM64_WEBDRIVER_URL}"
ZIPFILE=$(ls | grep -E '.zip' | grep 'chromedriver')
unzip $ZIPFILE -d tmp
cp ./tmp/chromedriver ./
rm -rf tmp
rm -f $ZIPFILE
