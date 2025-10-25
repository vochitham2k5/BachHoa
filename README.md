# BachHoa

## Backend (Django) – Hướng dẫn chạy trên Windows

Backend Django nằm tại `DuAnBachHoa/backend_django`. Làm theo các bước sau trong PowerShell:

1) Vào thư mục backend

	```powershell
	cd "c:/Users/Tai/Desktop/TV/BachHoa/DuAnBachHoa/backend_django"
	```

2) Tạo virtualenv và kích hoạt

	```powershell
	python -m venv env
	.\env\Scripts\activate
	```

3) Cài dependencies

	```powershell
	pip install -r requirements.txt
	```

4) Xoá file SQLite cũ (nếu có)

	```powershell
	if (Test-Path .\db.sqlite3) { Remove-Item .\db.sqlite3 }
	```

5) Tạo và áp dụng migrations

	```powershell
	python manage.py makemigrations
	python manage.py migrate
	```

6) Tạo superuser (ví dụ)

	```powershell
	python manage.py createsuperuser
	# Ví dụ:
	# username: admin
	# email: admin@gmail.com
	# password: 123
	# xác thực pass: 123
	# Nhấn Y rồi Enter
	```

7) Chạy server backend (mặc định 127.0.0.1:8000)

	```powershell
	python manage.py runserver
	# hoặc chỉ định rõ
	python manage.py runserver 127.0.0.1:8000

8) chạy frontend bằng lệnh
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Location -Path 'c:/Users/Tai/Desktop/TV/BachHoa/DuAnBachHoa/frontend'; npm start --no-open"
	```

Gợi ý: Frontend đã đặt `REACT_APP_API_BASE=http://127.0.0.1:8000`, nên hãy chạy backend ở cổng 8000 để frontend kết nối đúng. Nếu bạn đổi cổng, nhớ cập nhật file `DuAnBachHoa/frontend/.env` rồi khởi động lại frontend dev server.

Tài khoản mẫu (tuỳ chọn): Hệ thống có thể tự seed dữ liệu demo (admin và seller) phục vụ thử nghiệm. Bạn vẫn nên tạo superuser riêng theo nhu cầu.