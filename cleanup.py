import shutil
import os

path = r"G:\Court-Reservation.Nextjs\src\app\api\courts\photos"
if os.path.exists(path):
    try:
        shutil.rmtree(path, ignore_errors=True)
        print(f"Deleted {path}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"{path} does not exist")
