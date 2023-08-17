from src.chromedriver import ChromeDriver
from src.constants import LOGIN_URL
from src.env import EnvConfig

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.utils import submit


if __name__ == "__main__":
    env = EnvConfig()
    with ChromeDriver(excutable_path="./webdrivers/chromedriver") as driver:
        driver.get(LOGIN_URL)
        wait = WebDriverWait(driver, 10)
        print("Loading login page...")
        username_elem_locator = (By.ID, "username")
        wait.until(EC.element_to_be_clickable(username_elem_locator))
        print("Login page loaded.")
        driver.find_element(*username_elem_locator).send_keys(env.username)

        password_elem_locator = (By.ID, "password")
        wait.until(EC.element_to_be_clickable(password_elem_locator))
        driver.find_element(*password_elem_locator).send_keys(env.password)

        driver.find_element(by=By.ID, value="Login").click()
        print("Login...")
        # eait until logged in page show
        wait.until(EC.presence_of_element_located((By.ID, "networkNameHeaderText")))

        print("Started reporting")
        for roomNo in ["101", "102", "201", "202"]:
            submit(driver, roomNo, env.retry_attempt)
            print(f"{roomNo} reported")
