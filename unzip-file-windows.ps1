param([string]$file,[string]$output)

# usage: powershell ./unzip-file-windows.ps1 -file filename.zip -output C:\some\target\path

$temp = "$PSScriptRoot\unzipped"
Expand-Archive -LiteralPath "$PSScriptRoot\$file" -DestinationPath $temp
Set-Location -Path $PSScriptRoot\unzipped\haxe*
dir
xcopy * $output /s /y