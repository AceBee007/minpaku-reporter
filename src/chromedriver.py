from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options


class ChromeDriver(object):
    def __init__(self, excutable_path: str):
        options = Options()
        options.binary_location = (
            "./Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
        )
        options.add_argument("--headless")
        service = Service(executable_path=excutable_path)
        self.driver = webdriver.Chrome(service=service, options=options)

    def __enter__(self):
        return self.driver

    def __exit__(self, exception_type, exception_value, traceback):
        self.driver.close()
