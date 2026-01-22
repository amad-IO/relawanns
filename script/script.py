from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import random
import time
import os
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
from faker import Faker
from pathlib import Path
import logging
import threading

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Thread-safe counter
lock = threading.Lock()

# Configuration
TARGET_URL = "https://relawanns.netlify.app/daftar"
IMAGE_FOLDER = r"C:\Users\LENOVO\OneDrive\Pictures\Screenshots"
NUM_USERS = 50
MAX_WORKERS = 3  # Maksimal 3 browser bersamaan
HEADLESS = False  # Set to True to hide browser windows
TIMEOUT = 30  # seconds

# Initialize Faker for generating realistic data
fake = Faker('id_ID')  # Indonesian locale

class RegistrationTester:
    def __init__(self):
        self.successful_registrations = 0
        self.failed_registrations = 0
        self.total_requests = 0
        self.start_time = None
        self.website_down = False
        self.registration_closed = False
        
    def create_driver(self):
        """Create a Chrome WebDriver instance"""
        try:
            chrome_options = Options()
            if HEADLESS:
                chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_argument('--log-level=3')  # Suppress warnings
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # Try to use local chromedriver.exe first
            chromedriver_path = os.path.join(os.getcwd(), 'chromedriver.exe')
            if os.path.exists(chromedriver_path):
                logger.debug(f"Using local chromedriver: {chromedriver_path}")
                service = Service(chromedriver_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                # Use webdriver-manager to download automatically
                logger.debug("Using webdriver-manager to get chromedriver")
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
            
            driver.set_page_load_timeout(TIMEOUT)
            return driver
        except Exception as e:
            logger.error(f"Error creating WebDriver: {e}")
            return None
        
    def get_random_image(self):
        """Get a random image from the screenshots folder"""
        try:
            image_files = glob.glob(os.path.join(IMAGE_FOLDER, "*.png"))
            image_files.extend(glob.glob(os.path.join(IMAGE_FOLDER, "*.jpg")))
            image_files.extend(glob.glob(os.path.join(IMAGE_FOLDER, "*.jpeg")))
            
            if not image_files:
                logger.warning(f"No images found in {IMAGE_FOLDER}")
                return None
            
            return random.choice(image_files)
        except Exception as e:
            logger.error(f"Error getting random image: {e}")
            return None
    
    def generate_user_data(self, user_num):
        """Generate random user data for registration"""
        kota_indonesia = [
            'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 
            'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
            'Bogor', 'Malang', 'Yogyakarta', 'Denpasar', 'Balikpapan'
        ]
        
        return {
            'nama_lengkap': fake.name(),
            'email': f"test{user_num}_{random.randint(1000, 9999)}@test.com",
            'no_whatsapp': f"08{random.randint(10000000, 99999999)}",
            'usia': random.randint(17, 60),
            'kota_domisili': random.choice(kota_indonesia)
        }
    
    def submit_registration(self, user_num):
        """Submit a single registration using Selenium"""
        driver = None
        try:
            user_data = self.generate_user_data(user_num)
            image_path = self.get_random_image()
            
            logger.info(f"User {user_num}: Starting registration for {user_data['nama_lengkap']}")
            
            # Create driver
            driver = self.create_driver()
            if not driver:
                raise Exception("Failed to create WebDriver")
            
            # Load the page
            driver.get(TARGET_URL)
            time.sleep(2)  # Wait for page to load
            
            # Check if registration is closed
            page_text = driver.page_source.lower()
            if 'pendaftaran ditutup' in page_text or 'registration closed' in page_text or 'kuota penuh' in page_text:
                logger.warning(f"User {user_num}: Registration appears to be CLOSED!")
                with lock:
                    self.registration_closed = True
                    self.failed_registrations += 1
                    self.total_requests += 1
                return {'user_num': user_num, 'status': 'registration_closed'}
            
            # Try to find and fill form fields
            wait = WebDriverWait(driver, 10)
            
            # Based on actual form inspection, use these exact field names:
            try:
                # Nama Lengkap (name)
                name_field = wait.until(EC.presence_of_element_located((By.ID, 'name')))
                name_field.clear()
                name_field.send_keys(user_data['nama_lengkap'])
                logger.info(f"User {user_num}: Filled name field")
                
                # Email
                email_field = driver.find_element(By.ID, 'email')
                email_field.clear()
                email_field.send_keys(user_data['email'])
                logger.info(f"User {user_num}: Filled email field")
                
                # Phone (WhatsApp)
                phone_field = driver.find_element(By.ID, 'phone')
                phone_field.clear()
                phone_field.send_keys(user_data['no_whatsapp'])
                logger.info(f"User {user_num}: Filled phone field")
                
                # Age (Usia)
                age_field = driver.find_element(By.ID, 'age')
                age_field.clear()
                age_field.send_keys(str(user_data['usia']))
                logger.info(f"User {user_num}: Filled age field")
                
                # City (Kota Domisili)
                city_field = driver.find_element(By.ID, 'city')
                city_field.clear()
                city_field.send_keys(user_data['kota_domisili'])
                logger.info(f"User {user_num}: Filled city field")
                
                logger.info(f"User {user_num}: All 5 fields filled successfully")
                
            except Exception as e:
                logger.error(f"User {user_num}: Error filling fields - {str(e)}")
                raise
            
            # Try to upload file (paymentProof)
            if image_path and os.path.exists(image_path):
                try:
                    file_input = driver.find_element(By.ID, 'paymentProof')
                    file_input.send_keys(image_path)
                    logger.info(f"User {user_num}: Payment proof file uploaded")
                except Exception as e:
                    logger.warning(f"User {user_num}: Could not upload file - {str(e)}")
            
            # Find and click submit button
            try:
                submit_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[type="submit"]')))
                
                # Scroll to button to make sure it's visible
                driver.execute_script("arguments[0].scrollIntoView(true);", submit_button)
                time.sleep(1)
                
                # Get URL before submit
                url_before = driver.current_url
                
                # Click using JavaScript to ensure it works
                driver.execute_script("arguments[0].click();", submit_button)
                logger.info(f"User {user_num}: ✓ Tombol DAFTAR diklik")
                
            except Exception as e:
                logger.warning(f"User {user_num}: Tidak bisa klik tombol daftar - {str(e)}")
                with lock:
                    self.failed_registrations += 1
                    self.total_requests += 1
                return {'user_num': user_num, 'status': 'no_submit_button'}
            
            # PENTING: Tunggu popup confirm muncul
            logger.info(f"User {user_num}: Menunggu popup konfirmasi...")
            time.sleep(3)  # Tunggu popup muncul
            
            # Cari dan klik tombol "Ya, Kirim Data" di popup
            try:
                confirm_clicked = False
                
                # Coba berbagai cara untuk menemukan tombol Ya
                logger.info(f"User {user_num}: Mencari tombol 'Ya, Kirim Data'...")
                
                # Cara 1: Cari button dengan text "Ya"
                try:
                    ya_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ya')]"))
                    )
                    driver.execute_script("arguments[0].click();", ya_button)
                    logger.info(f"User {user_num}: ✓✓ Tombol 'Ya' di popup DIKLIK")
                    confirm_clicked = True
                except:
                    logger.info(f"User {user_num}: Cara 1 gagal, coba cara lain...")
                
                # Cara 2: Cari button yang visible dengan kata "ya" atau "kirim"
                if not confirm_clicked:
                    try:
                        buttons = driver.find_elements(By.TAG_NAME, 'button')
                        for btn in buttons:
                            btn_text = btn.text.lower()
                            if btn.is_displayed() and ('ya' in btn_text or 'kirim' in btn_text):
                                driver.execute_script("arguments[0].click();", btn)
                                logger.info(f"User {user_num}: ✓✓ Button popup DIKLIK: '{btn.text}'")
                                confirm_clicked = True
                                break
                    except Exception as e:
                        logger.warning(f"User {user_num}: Cara 2 error - {str(e)}")
                
                # Cara 3: Print semua button yang ada untuk debugging
                if not confirm_clicked:
                    logger.warning(f"User {user_num}: Tidak menemukan button Ya. Mencoba list semua button...")
                    try:
                        all_buttons = driver.find_elements(By.TAG_NAME, 'button')
                        logger.info(f"User {user_num}: Total button di page: {len(all_buttons)}")
                        for i, btn in enumerate(all_buttons):
                            if btn.is_displayed():
                                logger.info(f"User {user_num}: Button {i}: '{btn.text}' - visible: {btn.is_displayed()}")
                    except:
                        pass
                
                if not confirm_clicked:
                    logger.error(f"User {user_num}: ✗✗ GAGAL menemukan/klik tombol Ya di popup!")
                    # Screenshot untuk debugging
                    try:
                        driver.save_screenshot(f"failed_popup_user_{user_num}.png")
                        logger.info(f"User {user_num}: Screenshot saved: failed_popup_user_{user_num}.png")
                    except:
                        pass
                    
            except Exception as e:
                logger.error(f"User {user_num}: Error saat handle popup - {str(e)}")
            
            # TUNGGU 7-10 detik penuh setelah klik Ya untuk server proses
            logger.info(f"User {user_num}: ⏳ Menunggu 10 detik untuk server memproses...")
            time.sleep(10)
            
            # Check untuk JavaScript alert
            try:
                alert = driver.switch_to.alert
                alert_text = alert.text
                logger.info(f"User {user_num}: JavaScript Alert: {alert_text}")
                alert.accept()
                time.sleep(2)
            except:
                pass  # No alert
            
            # Get current state
            page_text = driver.page_source.lower()
            current_url = driver.current_url
            page_title = driver.title.lower()
            
            logger.info(f"User {user_num}: Current URL: {current_url}")
            logger.info(f"User {user_num}: Page title: {page_title}")
            
            # Check for success indicators
            success_indicators = ['berhasil', 'success', 'terima kasih', 'thank you', 'sukses', 'terdaftar']
            error_indicators = ['error', 'gagal', 'failed', 'ditutup', 'penuh', 'tidak dapat']
            
            # Check if URL changed (might redirect after success)
            url_changed = current_url != url_before
            if url_changed:
                logger.info(f"User {user_num}: URL changed - likely successful submission")
            
            if any(indicator in page_text for indicator in success_indicators) or any(indicator in page_title for indicator in success_indicators):
                with lock:
                    self.successful_registrations += 1
                    self.total_requests += 1
                logger.info(f"User {user_num}: ✓ SUCCESS - Registration completed!")
                return {'user_num': user_num, 'status': 'success'}
            elif any(indicator in page_text for indicator in error_indicators):
                with lock:
                    self.failed_registrations += 1
                    self.total_requests += 1
                logger.warning(f"User {user_num}: ✗ FAILED - Error message detected")
                return {'user_num': user_num, 'status': 'failed_with_error'}
            elif url_changed:
                # URL changed but no clear success message - assume success
                with lock:
                    self.successful_registrations += 1
                    self.total_requests += 1
                logger.info(f"User {user_num}: ✓ SUCCESS - URL changed after submit")
                return {'user_num': user_num, 'status': 'success_url_change'}
            else:
                # Form submitted, no error, but not sure about success
                with lock:
                    self.successful_registrations += 1
                    self.total_requests += 1
                logger.info(f"User {user_num}: ⚠ Likely SUCCESS - Form submitted, no errors detected")
                return {'user_num': user_num, 'status': 'submitted'}
                
        except TimeoutException:
            with lock:
                self.failed_registrations += 1
                self.total_requests += 1
            logger.error(f"User {user_num}: TIMEOUT - Page took too long to load")
            return {'user_num': user_num, 'status': 'timeout'}
            
        except WebDriverException as e:
            with lock:
                self.failed_registrations += 1
                self.total_requests += 1
                self.website_down = True
            logger.error(f"User {user_num}: WEBDRIVER ERROR - {str(e)[:100]}")
            return {'user_num': user_num, 'status': 'webdriver_error'}
            
        except Exception as e:
            with lock:
                self.failed_registrations += 1
                self.total_requests += 1
            logger.error(f"User {user_num}: ERROR - {str(e)}")
            return {'user_num': user_num, 'status': 'error', 'error': str(e)}
        
        finally:
            if driver:
                try:
                    # Take screenshot before closing (for debugging)
                    try:
                        screenshot_path = f"screenshot_user_{user_num}.png"
                        driver.save_screenshot(screenshot_path)
                        logger.debug(f"User {user_num}: Screenshot saved to {screenshot_path}")
                    except:
                        pass
                    
                    driver.quit()
                except:
                    pass
    
    def check_website_status(self):
        """Check if website is still accessible"""
        driver = None
        try:
            driver = self.create_driver()
            if not driver:
                return False
            
            driver.get(TARGET_URL)
            time.sleep(2)
            
            # Check page title and content
            page_text = driver.page_source.lower()
            
            if 'pendaftaran ditutup' in page_text or 'registration closed' in page_text:
                logger.warning("Website shows: REGISTRATION CLOSED")
                self.registration_closed = True
                return True  # Website is up, but registration closed
            
            if 'daftar' in page_text or 'form' in page_text:
                logger.info("Website is UP and registration form is accessible")
                return True
            
            logger.warning("Website content unexpected")
            return True
            
        except Exception as e:
            logger.error(f"Website appears to be DOWN: {e}")
            self.website_down = True
            return False
        finally:
            if driver:
                try:
                    driver.quit()
                except:
                    pass
    
    def run_load_test(self, continuous=True):
        """Run the load test"""
        logger.info(f"="*60)
        logger.info(f"Starting Load Test")
        logger.info(f"Target: {TARGET_URL}")
        logger.info(f"Number of users: {NUM_USERS}")
        logger.info(f"Max concurrent workers: {MAX_WORKERS}")
        logger.info(f"Continuous mode: {continuous}")
        logger.info(f"="*60)
        
        # Check if image folder exists
        if not os.path.exists(IMAGE_FOLDER):
            logger.warning(f"Image folder not found: {IMAGE_FOLDER}")
            logger.warning("Will proceed without file uploads")
        
        # Initial website check
        if not self.check_website_status():
            logger.error("Initial check failed - website appears to be down or inaccessible")
            return
        
        self.start_time = time.time()
        round_num = 1
        
        try:
            while True:
                logger.info(f"\n{'='*60}")
                logger.info(f"Starting Round {round_num} - Sending {NUM_USERS} registrations")
                logger.info(f"{'='*60}\n")
                
                # Use ThreadPoolExecutor for concurrent requests
                with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                    futures = []
                    
                    for i in range(1, NUM_USERS + 1):
                        future = executor.submit(self.submit_registration, i)
                        futures.append(future)
                        
                        # Jika MAX_WORKERS = 1, tunggu selesai dulu baru lanjut
                        if MAX_WORKERS == 1:
                            logger.info(f"\n{'='*60}")
                            logger.info(f"Menunggu User {i} selesai sebelum lanjut ke user berikutnya...")
                            logger.info(f"{'='*60}\n")
                            result = future.result()  # Wait for completion
                            time.sleep(2)  # Delay sebelum user berikutnya
                        else:
                            time.sleep(2)  # Delay between starting each browser
                    
                    # Wait for all requests to complete (jika concurrent)
                    if MAX_WORKERS > 1:
                        for future in as_completed(futures):
                            result = future.result()
                
                # Print statistics
                self.print_statistics()
                
                # Check if website is still accessible
                logger.info("\nChecking website status...")
                if not self.check_website_status():
                    logger.error("Website is DOWN or registration is closed!")
                    logger.info("This could mean:")
                    logger.info("1. Website crashed due to load")
                    logger.info("2. Registration limit was reached and auto-closed")
                    break
                
                if not continuous:
                    break
                
                round_num += 1
                logger.info(f"\nWaiting 5 seconds before next round...\n")
                time.sleep(5)
                
        except KeyboardInterrupt:
            logger.info("\n\nTest interrupted by user")
        
        # Final statistics
        logger.info("\n" + "="*60)
        logger.info("FINAL TEST RESULTS")
        logger.info("="*60)
        self.print_statistics()
    
    def print_statistics(self):
        """Print current test statistics"""
        elapsed_time = time.time() - self.start_time if self.start_time else 0
        
        logger.info(f"\n{'='*60}")
        logger.info(f"STATISTICS")
        logger.info(f"{'='*60}")
        logger.info(f"Total requests sent: {self.total_requests}")
        logger.info(f"Successful registrations: {self.successful_registrations}")
        logger.info(f"Failed registrations: {self.failed_registrations}")
        if self.total_requests > 0:
            success_rate = (self.successful_registrations / self.total_requests) * 100
            logger.info(f"Success rate: {success_rate:.2f}%")
        logger.info(f"Elapsed time: {elapsed_time:.2f} seconds")
        if elapsed_time > 0:
            logger.info(f"Requests per second: {self.total_requests / elapsed_time:.2f}")
        logger.info(f"{'='*60}\n")


def main():
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     REGISTRATION LOAD TESTING SCRIPT                      ║
    ║     Target: https://relawanns.netlify.app/daftar        ║
    ╚══════════════════════════════════════════════════════════╝
    
    This script will:
    1. Test if the website can handle high traffic (stress test)
    2. Test if registration auto-closes when limit is reached
    
    WARNING: This is for testing purposes only!
    """)
    
    response = input("Do you want to run in CONTINUOUS mode? (y/n): ")
    continuous = response.lower() == 'y'
    
    tester = RegistrationTester()
    tester.run_load_test(continuous=continuous)


if __name__ == "__main__":
    main()
