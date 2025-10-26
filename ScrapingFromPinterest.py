from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import requests
import os
import time
from PIL import Image
from io import BytesIO

# הגדרת אפשרויות עבור Chrome
options = Options()
# options.add_argument("--headless")  # ביטול מצב ראש ללא דפדפן (אפשר להחזיר אחרי בדיקות)
options.add_argument("--disable-gpu")

# אתחול ChromeDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

# פתיחת האתר
url = "https://www.pinterest.com/search/pins/?q=antique%20furniture%20table"
driver.get(url)
time.sleep(3)  # המתנה לטעינת הדף

# יצירת תיקייה לשמירת התמונות
os.makedirs("images", exist_ok=True)

# משתנים למעקב אחרי התמונות
image_urls = set()
previous_count = 0  # כמה תמונות היו לפני הגלילה
scroll_attempts = 0
max_scrolls = 50  # מגבלת ביטחון, שלא ניכנס ללולאה אינסופית

while scroll_attempts < max_scrolls:
    # גלילה למטה
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(3)  # המתנה לטעינת תמונות חדשות

    # השגת רשימת התמונות מחדש אחרי כל גלילה כדי למנוע שגיאת stale element
    try:
        images = driver.find_elements(By.TAG_NAME, "img")  # איתור תמונות אחרי כל גלילה
    except Exception as e:
        print(f"⚠️ שגיאה באיתור תמונות: {e}")
        continue

    # איסוף תמונות חדשות לרשימה
    new_images_found = 0
    for image in images:
        try:
            img_url = image.get_attribute("src")
            if img_url and img_url not in image_urls:
                image_urls.add(img_url)
                new_images_found += 1
        except:
            continue  # מתעלם מתמונות שכבר לא קיימות (Stale Element)

    # בדיקה אם נוספו תמונות חדשות
    if new_images_found == 0:
        print(f"⚠️ אין יותר תמונות חדשות אחרי {scroll_attempts} גלילות.")
        break  # עצירה אם לא נוספו תמונות
    else:
        previous_count = len(image_urls)  # עדכון כמות התמונות
        print(f"🔽 גלילה {scroll_attempts + 1}, נוספו {new_images_found} תמונות, סה\"כ: {len(image_urls)}")
    
    scroll_attempts += 1

# הורדת כל התמונות שנמצאו
for index, img_url in enumerate(image_urls):
    try:
        img_data = requests.get(img_url).content
        img = Image.open(BytesIO(img_data))
        
        # שינוי גודל התמונה
        img = img.resize((800, 800))  
        
        # שמירת התמונה
        img.save(f"images/image_{index}.jpg")
        print(f"✅ נשמרה תמונה: images/image_{index}.jpg")
    except Exception as e:
        print(f"❌ שגיאה בהורדת התמונה {index}: {e}")

# סגירת הדפדפן
driver.quit()
print(f"🎉 סיימת להוריד {len(image_urls)} תמונות.")

