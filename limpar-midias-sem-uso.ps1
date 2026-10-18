# Remove do projeto (via git rm) mídias que o jogo NÃO usa mais.
# Conferido em 18/10/2026: nenhum arquivo do src/ referencia estes caminhos.
# Rodar dentro de C:\backend\frontend:
#   powershell -ExecutionPolicy Bypass -File .\limpar-midias-sem-uso.ps1
# Os arquivos continuam no histórico do Git; dá para recuperar com git checkout.

$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot

$arquivos = @(
  # --- GIFs substituídos por .webm nesta otimização ---
  'public/images/stations/ACEE-Rotacionando.gif',
  'public/images/stations/ALMAZ-Rotacionando.gif',
  'public/images/stations/MOL-Rotacionando.gif',
  'public/images/stations/SKYLAB-Rotacionando.gif',
  'public/images/stations/TIANGONG-Rotacionando.gif',
  'public/images/stations/DELFOS-Rotacionando.gif',
  'public/images/Planets/calisto-rotacionando.gif',
  'public/images/Planets/encelado-rotacionando.gif',
  'public/images/Planets/mimas-rotacionando.gif',
  'public/images/Planets/tita-rotacionando.gif',
  'public/images/Planets/titania-rotacionando.gif',
  'public/images/Planets/tritao-rotacionando.gif',
  'public/images/Planets/kappa-rotacionando.gif',
  'public/images/Astronautas/E1/Mae_video.gif',
  'public/images/Astronautas/E1/Neo_video.gif',
  'public/images/Astronautas/E1/Tamara_video.gif',
  'public/images/Astronautas/E1/Equipe1.gif',
  'public/images/Astronautas/E2/Equipe2.gif',
  'public/images/Astronautas/E3/Equipe3.gif',
  'public/images/Astronautas/E4/Equipe4.gif',
  'public/images/Astronautas/E5/Equipe5.gif',
  'public/images/Minerva/Minerva-Informando-velocidade.gif',
  'public/images/ST CUPERTINO/st_cupertino_comemorando.gif',
  # --- Sobras sem nenhuma referência no código ---
  'public/images/Vluz-Dobra2.gif',
  'public/images/Vluz-Dobraori.webm',
  'public/images/clouds-Ori.webm',
  'public/images/clouds2.webm',
  'public/images/decolagem10.gif',
  'public/images/Decolagem10.mp4',
  'public/images/Earth - Copia.png',
  'public/images/earth.png',
  'public/images/Terra.webp',
  'public/images/Mercúrio.png',
  'public/images/mercury.png',
  'public/images/sun.png',
  'public/images/logogalaticQuest-Original.png',
  'public/images/Minerva/Minerva-Informando velocidade.mp4',
  'public/images/Minerva/Minerva.mp4',
  'public/images/Astronautas/E1/Neo-video.mp4',
  'public/images/Planets/Marte-RotacionandoOLD.gif',
  'public/images/Planets/saturno-rotacionando - Copia.webm',
  'public/images/stations/BOCTOK-Rotacionando OLD.webm',
  'public/images/stations/SALYUT-Rotacionando.gif',
  'public/sounds/Decolagem.wav',
  'public/sounds/Fim_do_jogo.mp3',
  'public/sounds/01. Intro_To_the_Stars.mp3',
  'public/sounds/space-flight-2-179590.mp3',
  'public/sounds/space-flight-3-276513.mp3',
  'public/sounds/solar-system-space-journey-153272.mp3',
  'public/sounds/alien-talking-333354.mp3',
  'public/sounds/power-down-Warpold.mp3',
  'public/sounds/sos-minerva.mp4',
  "src/ErrorBoundary.js'"
)

# O vídeo "Image to video ... personagem falando..." tem um caractere especial no nome:
Get-ChildItem -LiteralPath 'public/images/Astronautas/E1' -Filter '*personagem falando*.mp4' -ErrorAction SilentlyContinue |
  ForEach-Object { $arquivos += ('public/images/Astronautas/E1/' + $_.Name) }

$total = 0
foreach ($a in $arquivos) {
  if (Test-Path -LiteralPath $a) {
    $total += (Get-Item -LiteralPath $a).Length
    git rm -q -- "$a" 2>$null
    if (Test-Path -LiteralPath $a) { Remove-Item -LiteralPath $a -Force }  # arquivo fora do git
    Write-Host "removido: $a"
  }
}
Write-Host ("Total liberado: {0:N0} MB" -f ($total / 1MB))
Write-Host "Agora: git commit -m 'Remove midias sem uso' && git push origin teste"
