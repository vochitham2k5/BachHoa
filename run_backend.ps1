<#
 Run Django backend (Windows PowerShell)
 Defaults to 127.0.0.1:8000. You can override with -BindHost and -Port.
#>
param(
    [switch]$RecreateDb,
    [string]$BindHost = '127.0.0.1',
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$backendPath = "${PSScriptRoot}\DuAnBachHoa\backend_django"
Write-Host "Backend path: $backendPath"

if (-not (Test-Path $backendPath)) {
    Write-Error "Backend path not found: $backendPath"
}

Push-Location $backendPath

if (-not (Test-Path ".\env\Scripts\Activate.ps1")) {
    Write-Host "Creating virtual environment..."
    python -m venv env
}

Write-Host "Activating virtual environment..."
. .\env\Scripts\Activate.ps1

Write-Host "Installing requirements..."
python -m pip install --upgrade pip
pip install -r requirements.txt

if ($RecreateDb -or -not (Test-Path ".\db.sqlite3")) {
    if (Test-Path ".\db.sqlite3") { Remove-Item .\db.sqlite3 -Force }
    Write-Host "Running migrations..."
    python manage.py makemigrations
    python manage.py migrate
}

Write-Host "Starting server at http://$($BindHost):$($Port) ..."
python manage.py runserver "$($BindHost):$($Port)"

Pop-Location
