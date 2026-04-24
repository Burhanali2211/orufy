# PowerShell script to test login
$body = @{
    email = "testuser@example.com"
    password = "Test123!"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://himalayanspicesexports.com/api/auth/login" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}
# //we will be trying to deploy this again
