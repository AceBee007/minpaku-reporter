from datetime import datetime
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

import time

from src.constants import REG_NUM_PAIR, REPORT_URL_TEMPLATE


def construct_date(dt: datetime):
    month = f"{dt.month:02d}"
    # 年度は4月からなので、４より小さい月は、前年度になる
    year = dt.year - 1 if dt.month < 4 else dt.year
    return (year, month)


PREV_REPORT_PERIOD = {
    # curernt_month: (prev_month, year_adjust)
    12: (10, 0),
    1: (10, -1),
    2: (12, -1),
    3: (12, -1),
    4: (2, 0),
    5: (2, 0),
    6: (4, 0),
    7: (4, 0),
    8: (6, 0),
    9: (6, 0),
    10: (8, 0),
    11: (8, 0),
}


def get_previous_report_period_start_datetime():
    current_year = datetime.now().year
    current_month = datetime.now().month
    return datetime(
        year=current_year + PREV_REPORT_PERIOD[current_month][1],
        month=PREV_REPORT_PERIOD[current_month][0],
        day=1,
    )


def submit(driver: WebDriver, roomNo: str, retry_attempt: int):
    if retry_attempt <= 0:
        return
    year_month = construct_date(get_previous_report_period_start_datetime())
    print(f"Reporting period: {year_month}")
    target_url = REPORT_URL_TEMPLATE.format_map(
        {
            "year": year_month[0],
            "month": year_month[1],
            "registeredNo": REG_NUM_PAIR[roomNo],
        }
    )
    try:
        # set 10 sec timeout
        wait = WebDriverWait(driver, 10)
        driver.get(target_url)
        save_button_locator = (By.ID, "Jisseki_SaveButton")
        wait.until(EC.element_to_be_clickable(save_button_locator))
        driver.find_element(*save_button_locator).click()
        wait.until(EC.alert_is_present())
        Alert(driver).accept()
        close_button_locator = (By.CSS_SELECTOR, 'input[value="閉じる"]')
        wait.until(EC.element_to_be_clickable(close_button_locator))
        driver.find_element(*close_button_locator).click()
        time.sleep(1)
    except TimeoutException:
        print(f"Retrying... ({retry_attempt-1} times left)")
        submit(driver, roomNo, retry_attempt - 1)
