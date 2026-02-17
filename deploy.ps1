# Docker Build and Ansible Deployment Script
# This script builds the Docker image and deploys it to the LXC container
# Usage: .\deploy.ps1 [--skip-docker]

param(
    [switch]$SkipDocker
)

# Check and load Ansible configuration
if (-not (Test-Path "ansible\hosts")) {
    Write-Host "Ansible configuration missing. Setting up..." -ForegroundColor Yellow
    Push-Location -Path "ansible"
    .\setup-env.ps1
    Pop-Location
}

# Read version from version.txt
$version = Get-Content -Path "version.txt" -Raw
$version = $version.Trim()

if (-not $SkipDocker) {
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

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Building Docker image for version: $version" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Build Docker image
    Write-Host "Step 1/3: Building Docker image..." -ForegroundColor Yellow
    docker build -t netflix-clone .

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker build failed!" -ForegroundColor Red
        exit 1
    }

    # Tag Docker image with version
    Write-Host "`nStep 2/3: Tagging Docker image..." -ForegroundColor Yellow
    docker tag netflix-clone salkin263/netflix-clone:$version

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker tag failed!" -ForegroundColor Red
        exit 1
    }

    # Push Docker image
    Write-Host "`nStep 3/3: Pushing Docker image to registry..." -ForegroundColor Yellow
    docker push salkin263/netflix-clone:$version

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker push failed!" -ForegroundColor Red
        exit 1
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Docker build and push completed successfully!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
} else {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Skipping Docker build (--skip-docker flag)" -ForegroundColor Yellow
    Write-Host "Deploying version: $version" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
}

# Check if Ansible is available (check WSL first, then native)
Write-Host "Checking if Ansible is available..." -ForegroundColor Cyan
$ansibleAvailable = $false
$useWSL = $false

# Check WSL Ansible first
try {
    $wslCheck = wsl ansible --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ansibleAvailable = $true
        $useWSL = $true
        Write-Host "Ansible is available via WSL" -ForegroundColor Green
    }
} catch {
    # Try native Ansible
    try {
        $ansibleCheck = ansible --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ansibleAvailable = $true
            Write-Host "Ansible is available" -ForegroundColor Green
        }
    } catch {
        $ansibleAvailable = $false
    }
}

if (-not $ansibleAvailable) {
    Write-Host "`nAnsible is not available!" -ForegroundColor Yellow
    Write-Host "Please install Ansible via WSL or pip to deploy automatically." -ForegroundColor Yellow
    Write-Host "`nTo install via WSL:" -ForegroundColor Cyan
    Write-Host "  wsl sudo apt update && wsl sudo apt install ansible -y" -ForegroundColor White
    Write-Host "`nTo deploy manually, run:" -ForegroundColor Cyan
    Write-Host "  ssh root@192.168.1.155" -ForegroundColor White
    Write-Host "  cd /root/netflix-clone && docker-compose pull && docker-compose up -d" -ForegroundColor White
    exit 0
}

# Deploy with Ansible
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploying to LXC Container (192.168.1.155)" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Change to ansible directory
Push-Location -Path "ansible"

# Run Ansible playbook
Write-Host "Running Ansible deployment..." -ForegroundColor Yellow

if ($useWSL) {
    # Convert Windows path to WSL path
    $currentPath = (Get-Location).Path
    $wslPath = $currentPath -replace '\\', '/' -replace 'C:', '/mnt/c'
    
    # Always use password authentication
    Write-Host "Checking for sshpass..." -ForegroundColor Yellow
    
    # Check if sshpass is installed
    $sshpassInstalled = wsl which sshpass 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing sshpass (required for password authentication)..." -ForegroundColor Yellow
        wsl bash -c "sudo apt-get update > /dev/null 2>&1 && sudo apt-get install -y sshpass"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nsshpass installation failed!" -ForegroundColor Red
            Write-Host "Please install manually: wsl sudo apt install sshpass -y" -ForegroundColor Yellow
            Pop-Location
            exit 1
        }
        Write-Host "sshpass installed successfully" -ForegroundColor Green
    }
    
    Write-Host "`nYou will be prompted for the SSH password for root@192.168.1.155" -ForegroundColor Yellow
    Write-Host "Enter the root password when prompted.`n" -ForegroundColor Cyan
    
    # Run with password prompt and explicit SSH options
    wsl bash -c "cd '$wslPath' && ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i hosts update.yml --ask-pass --ssh-extra-args='-o PreferredAuthentications=password -o PubkeyAuthentication=no'"
} else {
    ansible-playbook update.yml --ask-pass
}

$ansibleExitCode = $LASTEXITCODE

# Return to original directory
Pop-Location

if ($ansibleExitCode -ne 0) {
    Write-Host "`nAnsible deployment failed!" -ForegroundColor Red
    Write-Host "Please check the Ansible output above for errors." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Netflix Clone version $version is now running on 192.168.1.155" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
