Write-Host "🚀 Instalando dependencias para las mejoras del panel de usuario..." -ForegroundColor Green
Write-Host ""

Write-Host "📦 Instalando paquetes de notificaciones..." -ForegroundColor Cyan
npx expo install expo-notifications expo-device expo-constants

Write-Host ""
Write-Host "✅ ¡Instalación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Reinicia el servidor de desarrollo"
Write-Host "2. Lee MEJORAS_IMPLEMENTADAS.md para ver cómo usar las nuevas funcionalidades"
Write-Host "3. Las notificaciones solo funcionan en dispositivos físicos"
Write-Host ""
Write-Host "🎾 ¡Disfruta las nuevas mejoras!" -ForegroundColor Magenta
