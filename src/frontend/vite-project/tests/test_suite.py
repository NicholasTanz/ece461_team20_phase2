from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Initialize the Selenium WebDriver
driver = webdriver.Chrome()

try:
    # Base URL of the application
    base_url = "http://localhost:3000"  # UI base

    # Test 1: Open the homepage and check the title
    driver.get(base_url)
    driver.maximize_window()
    assert "Package Manager" in driver.title, "Title does not match."

    # Test 2: Navigate to the "Package Options" and check URL
    input_box = driver.find_element(By.ID, "package-name")
    input_box.send_keys("12345") # id for package
    time.sleep(1)

    package_options_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Package Options')]")
    package_options_button.click()
    time.sleep(2)
    assert "/package/12345" in driver.current_url, "Navigation to Package Options failed."

    # Test 3: Interact with the Package Cost component
    driver.get(f"{base_url}/package/12345/cost")
    time.sleep(2)
    assert "Package Cost" in driver.page_source, "Failed to load Package Cost component."

    # Test 4: Interact with the Reset System component
    driver.get(f"{base_url}/reset")
    time.sleep(2)
    reset_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Reset')]")
    reset_button.click()
    time.sleep(2)
    alert = driver.switch_to.alert
    assert "System reset successfully!" in alert.text, "Reset system failed."
    alert.accept()

    # Test 5: Interact with the Find Packages by RegEx component
    driver.get(f"{base_url}/package/byRegEx")
    time.sleep(2)
    regex_input = driver.find_element(By.XPATH, "//input[@placeholder='Enter RegEx']")
    regex_input.send_keys(".*")
    search_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Search')]")
    search_button.click()
    time.sleep(2)
    assert "No packages found." in driver.page_source or driver.find_elements(By.TAG_NAME, "li"), \
        "Find Packages by RegEx failed."

    # Test 6: Post a package
    driver.get(f"{base_url}/package")
    time.sleep(2)
    assert "Package Post" in driver.page_source, "Failed to load Package Post component."

    # Test 7: Interact with the Package Handler component
    driver.get(f"{base_url}/package/12345")
    time.sleep(2)
    assert "Package Handler" in driver.page_source, "Failed to load Package Handler component."

    # Select and perform "Delete Package"
    select_action = driver.find_element(By.ID, "action-type")
    select_action.click()
    delete_option = driver.find_element(By.XPATH, "//option[@value='delete']")
    delete_option.click()
    action_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Perform Action')]")
    action_button.click()
    time.sleep(2)
    assert f"Package 12345 successfully deleted." in driver.page_source, "Delete Package action failed."

finally:
    # Quit the browser
    driver.quit()
