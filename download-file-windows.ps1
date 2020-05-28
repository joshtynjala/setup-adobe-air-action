param([string]$url,[string]$output)

# usage: powershell ./download-file-windows.ps1 -url https://exaample.com/filename.zip -output filename.zip

Write-Host "url : " $url 
Write-Host "output : " $output 

$output_file = "$PSScriptRoot\$output"

$wc = New-Object System.Net.WebClient
$wc.DownloadFile($url, $output_file)