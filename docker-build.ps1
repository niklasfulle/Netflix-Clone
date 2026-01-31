# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Cyan
$dockerRunning = $false
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "Docker is running" -ForegroundColor Green
    }
} catch {
    $dockerRunning = $false
}

# Start Docker if not running
if (-not $dockerRunning) {
    Write-Host "Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    
    # Try to start Docker Desktop
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process -FilePath $dockerPath
        
        # Wait for Docker to start (max 60 seconds)
        Write-Host "Waiting for Docker to start..." -ForegroundColor Yellow
        $timeout = 60
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            Start-Sleep -Seconds 2
            $elapsed += 2
            try {
                docker ps > $null 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Docker started successfully" -ForegroundColor Green
                    $dockerRunning = $true
                    break
                }
            } catch {
                continue
            }
            Write-Host "." -NoNewline
        }
        Write-Host ""
        
        if (-not $dockerRunning) {
            Write-Host "Docker failed to start within $timeout seconds" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Docker Desktop not found at: $dockerPath" -ForegroundColor Red
        Write-Host "Please install Docker Desktop or start it manually" -ForegroundColor Red
        exit 1
    }
}

# Read version from version.txt
$version = Get-Content -Path "version.txt" -Raw
$version = $version.Trim()

Write-Host "Building Docker image for version: $version" -ForegroundColor Green

# Build Docker image
docker build -t netflix-clone .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Tag Docker image with version
docker tag netflix-clone salkin263/netflix-clone:$version

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker tag failed!" -ForegroundColor Red
    exit 1
}

# Push Docker image
docker push salkin263/netflix-clone:$version

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Successfully built and pushed salkin263/netflix-clone:$version" -ForegroundColor Green
