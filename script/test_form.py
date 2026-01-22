"""
Script untuk test dan inspect form structure
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os

TARGET_URL = "https://relawanns.netlify.app/daftar"
IMAGE_FOLDER = r"C:\Users\LENOVO\OneDrive\Pictures\Screenshots"

def test_form():
    print("="*60)
    print("TESTING FORM STRUCTURE")
    print("="*60)
    
    # Setup Chrome
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    
    # Try local chromedriver first
    chromedriver_path = os.path.join(os.getcwd(), 'chromedriver.exe')
    if os.path.exists(chromedriver_path):
        print(f"Using local chromedriver: {chromedriver_path}")
        service = Service(chromedriver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
    else:
        print("Using webdriver-manager")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        print(f"\nOpening: {TARGET_URL}")
        driver.get(TARGET_URL)
        time.sleep(3)
        
        print("\n" + "="*60)
        print("FORM FIELDS FOUND:")
        print("="*60)
        
        # Find all input fields
        inputs = driver.find_elements(By.TAG_NAME, 'input')
        for i, inp in enumerate(inputs, 1):
            inp_type = inp.get_attribute('type')
            inp_name = inp.get_attribute('name')
            inp_id = inp.get_attribute('id')
            inp_placeholder = inp.get_attribute('placeholder')
            print(f"\n{i}. Input Field:")
            print(f"   Type: {inp_type}")
            print(f"   Name: {inp_name}")
            print(f"   ID: {inp_id}")
            print(f"   Placeholder: {inp_placeholder}")
        
        # Find textareas
        textareas = driver.find_elements(By.TAG_NAME, 'textarea')
        for i, ta in enumerate(textareas, 1):
            ta_name = ta.get_attribute('name')
            ta_id = ta.get_attribute('id')
            print(f"\n{i}. Textarea:")
            print(f"   Name: {ta_name}")
            print(f"   ID: {ta_id}")
        
        # Find select elements
        selects = driver.find_elements(By.TAG_NAME, 'select')
        for i, sel in enumerate(selects, 1):
            sel_name = sel.get_attribute('name')
            sel_id = sel.get_attribute('id')
            print(f"\n{i}. Select:")
            print(f"   Name: {sel_name}")
            print(f"   ID: {sel_id}")
        
        # Find buttons
        buttons = driver.find_elements(By.TAG_NAME, 'button')
        print("\n" + "="*60)
        print("BUTTONS FOUND:")
        print("="*60)
        for i, btn in enumerate(buttons, 1):
            btn_type = btn.get_attribute('type')
            btn_text = btn.text
            btn_id = btn.get_attribute('id')
            print(f"\n{i}. Button:")
            print(f"   Type: {btn_type}")
            print(f"   Text: {btn_text}")
            print(f"   ID: {btn_id}")
        
        print("\n" + "="*60)
        print("Browser will stay open for 60 seconds for manual inspection...")
        print("="*60)
        time.sleep(60)
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\nClosing browser...")
        driver.quit()

if __name__ == "__main__":
    test_form()
