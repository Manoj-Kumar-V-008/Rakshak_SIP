# ==============================================================================
# RAKSHAK AI - FOLDER SCATTERING & BOOTSTRAP SCRIPT
# ==============================================================================
# This script automatically creates the entire enterprise folder architecture.
# Run this script in PowerShell from the project root.
# ==============================================================================

$Directories = @(
    # Design Assets Structure
    "design/wireframes",
    "design/mockups",
    "design/assets",
    "design/branding",

    # Documentation Structure (for SIP and Sprints)
    "docs/architecture",
    "docs/api",
    "docs/screens",
    "docs/sprints",
    "docs/research",

    # Source Directories
    "src/assets/images",
    "src/assets/fonts",
    
    # Navigation Architecture
    "src/navigation",
    
    # State Management Stores
    "src/store",
    
    # Future API & Native Services Layer
    "src/services",
    
    # Custom Hooks
    "src/hooks",
    
    # Core Design System/Theme System
    "src/theme",
    
    # Types & Interfaces
    "src/types",
    
    # Global Utilities & Helper Functions
    "src/utils",
    
    # Global Constant Configs
    "src/constants",

    # UI Components Architecture
    "src/components/common",
    "src/components/dashboard",
    "src/components/scanner",
    "src/components/education",
    
    # Application Screens
    "src/screens/splash",
    "src/screens/onboarding",
    "src/screens/dashboard",
    "src/screens/scanner",
    "src/screens/analysis",
    "src/screens/education",
    "src/screens/emergency",
    "src/screens/profile",
    "src/screens/admin"
)

Write-Host "Initializing folder structure for Rakshak AI..." -ForegroundColor Cyan

foreach ($Dir in $Directories) {
    if (-not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        Write-Host "Created directory: $Dir" -ForegroundColor Green
    } else {
        Write-Host "Directory already exists: $Dir" -ForegroundColor Yellow
    }
    
    # Create .gitkeep to ensure Git tracks these directories even if they are empty
    $GitKeepPath = Join-Path $Dir ".gitkeep"
    if (-not (Test-Path $GitKeepPath)) {
        New-Item -ItemType File -Path $GitKeepPath -Force | Out-Null
    }
}

Write-Host "`nRakshak AI frontend architecture directory scaffolding complete!" -ForegroundColor Cyan
Write-Host "You can now run 'npm install' or 'yarn install' to install dependencies." -ForegroundColor Green
