# Script to remove console.log, console.warn, console.error, console.debug statements
# This script removes entire lines containing console statements

$srcPath = "d:\client\perfumes\src"
$serverPath = "d:\client\perfumes\server"

function Remove-ConsoleStatements {
    param(
        [string]$Path
    )
    
    $files = Get-ChildItem -Path $Path -Recurse -File -Include "*.ts", "*.tsx"
    $totalRemoved = 0
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $originalLength = ($content | Measure-Object -Line).Lines
        
        # Remove console.log, console.warn, console.error, console.debug statements
        # This regex matches entire lines with console statements
        $newContent = $content -replace '^\s*console\.(log|warn|error|debug)\([^)]*\);?\s*\n', ''
        
        # Also handle multi-line console statements
        $newContent = $newContent -replace '^\s*console\.(log|warn|error|debug)\([^;]*\);?\s*$', '', 'Multiline'
        
        if ($content -ne $newContent) {
            Set-Content $file.FullName $newContent -Encoding UTF8
            $newLength = ($newContent | Measure-Object -Line).Lines
            $removed = $originalLength - $newLength
            $totalRemoved += $removed
            Write-Host "✓ $($file.Name): Removed $removed console statements"
        }
    }
    
    return $totalRemoved
}

Write-Host "=== REMOVING CONSOLE STATEMENTS ===" -ForegroundColor Cyan
Write-Host "Processing src directory..."
$srcRemoved = Remove-ConsoleStatements -Path $srcPath

Write-Host "`nProcessing server directory..."
$serverRemoved = Remove-ConsoleStatements -Path $serverPath

Write-Host "`n=== SUMMARY ===" -ForegroundColor Green
Write-Host "Total console statements removed: $($srcRemoved + $serverRemoved)"
Write-Host "✓ Cleanup complete!"

