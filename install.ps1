# installs the workflow into $HOME\.claude on windows (powershell 5.1 or 7).
#
#   powershell -ExecutionPolicy Bypass -File install.ps1            asks before anything optional
#   -Yes          defaults, no questions
#   -WithPstack   also install the pstack plugin (needs the claude cli)
#   -WithBrain    also install /brain, /dream and create ~\vault from brain-template
#   -Gitignore    also add the per repo notes files to your global gitignore
#   an agent (no console) gets no prompts: pass every switch you want.
#   -Force        replace skills that already exist (old copy kept as <name>.bak-<date>)
#   -DryRun       print what would happen, change nothing
#
# safe to run again. it never deletes, never touches git history, never pushes.
param([switch]$Yes, [switch]$Force, [switch]$DryRun, [switch]$WithPstack, [switch]$WithBrain, [switch]$Gitignore)
$ErrorActionPreference = 'Stop'

$RepoUrl = if ($env:WORKFLOW_REPO) { $env:WORKFLOW_REPO } else { 'https://github.com/gntrs/workflow.git' }
$Src = $PSScriptRoot
if (-not $Src -or -not (Test-Path (Join-Path $Src 'rules\RULES.md')) -or -not (Test-Path (Join-Path $Src 'SETUP.md'))) {
  $Src = Join-Path $HOME '.claude\workflow'
  if (Test-Path (Join-Path $Src '.git')) { git -C $Src pull -q --ff-only } else { git clone -q --depth 1 $RepoUrl $Src }
}

$Claude = Join-Path $HOME '.claude'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Did = @(); $Skipped = @()

function Ask($q) {
  if ($Yes) { return $true }
  if ([Console]::IsInputRedirected) { return $false }
  $r = Read-Host "$q [y/N]"; return ($r -eq 'y' -or $r -eq 'Y')
}
function Do-It($what, [scriptblock]$action) {
  if ($DryRun) { Write-Host "would: $what" } else { & $action }
}
function Same($a, $b) {
  if (-not (Test-Path $b)) { return $false }
  $ha = Get-ChildItem $a -Recurse -File | ForEach-Object { (Get-FileHash $_.FullName).Hash } | Sort-Object
  $hb = Get-ChildItem $b -Recurse -File | ForEach-Object { (Get-FileHash $_.FullName).Hash } | Sort-Object
  return (($ha -join ',') -eq ($hb -join ','))
}

$Pstack = $WithPstack -or ((-not $Yes) -and (Ask 'install pstack, the plugin cook runs on (recommended)?'))
$Brain = $WithBrain -or ((-not $Yes) -and (Ask 'install the brain (a notes vault at ~\vault, /brain and /dream)?'))
$Ignore = $Gitignore -or ((-not $Yes) -and (Ask 'add the per repo notes files (.claude/CLAUDE.md, log.md, tbd.md, plans/ ...) to your global gitignore?'))

Do-It "create $Claude\skills and tools" { New-Item -ItemType Directory -Force -Path (Join-Path $Claude 'skills'), (Join-Path $Claude 'tools') | Out-Null }

# 1. rules
$rules = Join-Path $Claude 'RULES.md'
if (-not (Same (Join-Path $Src 'rules\RULES.md') $rules)) {
  if (Test-Path $rules) { Do-It "back up RULES.md" { Copy-Item $rules "$rules.bak-$Stamp" } }
  Do-It "copy RULES.md" { Copy-Item (Join-Path $Src 'rules\RULES.md') $rules -Force }
  $Did += 'RULES.md'
}

# 2. the import line, appended
$cm = Join-Path $Claude 'CLAUDE.md'
if (-not (Test-Path $cm) -or -not (Select-String -Path $cm -SimpleMatch -Pattern '@RULES.md' -Quiet)) {
  Do-It "append @RULES.md to CLAUDE.md" { Add-Content -Path $cm -Value "`n@RULES.md" }
  $Did += 'CLAUDE.md: @RULES.md'
}

# 3. skills
Get-ChildItem (Join-Path $Src 'skills') -Directory | ForEach-Object {
  $name = $_.Name
  if (($name -eq 'brain' -or $name -eq 'dream') -and -not $Brain) { return }
  $dest = Join-Path $Claude "skills\$name"
  if (Test-Path $dest) {
    if (Same $_.FullName $dest) { return }
    if ($Force -or ((-not $Yes) -and (Ask "skills\$name already exists and differs. replace it (old copy kept)?"))) {
      Do-It "move $dest aside" { Move-Item $dest "$dest.bak-$Stamp" }
    } else { $script:Skipped += "skills\$name (exists, use -Force)"; return }
  }
  $from = $_.FullName
  Do-It "copy skills\$name" { Copy-Item $from $dest -Recurse }
  $script:Did += "skills\$name"
}

# 4. the size sweep probe, its runner and the brand check
foreach ($t in 'responsive-probe.js','probe-test.mjs','brand-check.mjs') {
  $to = Join-Path $Claude "tools\$t"
  $from = Join-Path $Src "tools\$t"
  if (-not (Same $from $to)) {
    Do-It "copy $t" { Copy-Item $from $to -Force }
    $Did += "tools\$t"
  }
}

# 5. optional: keep the per repo notes files out of every repo. exact paths, never all of .claude/
$Notes = '.claude/CLAUDE.md','.claude/log.md','.claude/tbd.md','.claude/taste.md','.claude/brand.md','.claude/plans/','.claude/research/','.claude/sql/','.claude/run/'
if ($Ignore -and (Get-Command git -ErrorAction SilentlyContinue)) {
  $gi = git config --global core.excludesFile
  if (-not $gi) { $gi = Join-Path $HOME '.gitignore_global'; Do-It "set core.excludesFile" { git config --global core.excludesFile $gi } }
  $gi = $gi -replace '^~', $HOME
  $have = if (Test-Path $gi) { Get-Content $gi } else { @() }
  $missing = $Notes | Where-Object { $have -notcontains $_ }
  if ($missing) { Do-It "append notes files to $gi" { Add-Content -Path $gi -Value $missing }; $Did += 'global gitignore: notes files' }
}

# 6. pstack
if ($Pstack) {
  Do-It "copy pstack" { Copy-Item (Join-Path $Src 'pstack') (Join-Path $Claude 'skills') -Recurse -Force }
  if (Get-Command claude -ErrorAction SilentlyContinue) {
    Do-It "install the pstack plugin" {
      $tag = (Select-String -Path (Join-Path $Src 'pstack\install.sh') -Pattern '^TAG="(.+)"').Matches[0].Groups[1].Value
      claude plugin marketplace add "https://github.com/ericlitman/open-pstack.git#$tag"
      claude plugin install pstack@open-pstack
      if (-not (Select-String -Path $cm -SimpleMatch -Pattern '@skills/pstack/models.md' -Quiet)) { Add-Content -Path $cm -Value "`n@skills/pstack/models.md" }
    }
    $Did += 'pstack'
  } else { $Skipped += 'pstack plugin: no claude cli on PATH' }
}

# 7. the brain
if ($Brain) {
  $vault = Join-Path $HOME 'vault'
  if (Test-Path $vault) { $Skipped += '~\vault exists, left as is' }
  else { Do-It "create ~\vault" { Copy-Item (Join-Path $Src 'brain-template') $vault -Recurse }; $Did += '~\vault' }
}

Write-Host ""
Write-Host ("installed: " + $(if ($Did.Count) { $Did -join ', ' } else { 'nothing new' }))
if ($Skipped.Count) { Write-Host ("skipped: " + ($Skipped -join '; ')) }
Write-Host "next: restart claude code, then type /cook <a real task>."
