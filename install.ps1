# installs the workflow into $HOME\.claude on windows (powershell 5.1 or 7), and updates it.
#
#   powershell -ExecutionPolicy Bypass -File install.ps1            asks before anything optional
#   -Yes              defaults, no questions: rules, skills, the tools. nothing optional
#   -WithPstack       also install the pstack plugin (needs the claude cli)
#   -WithBrain        also install /brain, /dream and create ~\vault from brain-template
#   -WithPermissions  also make claude code ask before every push, merge, pr, release and deploy command
#   -Gitignore        also add the per repo notes files to your global gitignore
#   an agent (no console) gets no prompts: pass every switch you want.
#   -Force            replace files you edited too (your copy goes to ~\.claude\workflow-backups\)
#   -DryRun           print what would happen, change nothing
#   -Status           what is installed, what is behind, what you edited. changes nothing
#   -Uninstall        move every file it installed and you did not edit to workflow-backups\
#
# run it again to update. a file you did not touch is replaced, a file you edited is kept and named.
# your own settings live in ~\.claude\RULES.local.md, which is created once and never written again.
# it never deletes (old copies are moved to workflow-backups\), never touches git history, never pushes.
[CmdletBinding()]
param([switch]$Yes, [switch]$Force, [switch]$DryRun, [switch]$Status, [switch]$Uninstall,
      [switch]$WithPstack, [switch]$WithBrain, [switch]$WithPermissions, [switch]$WithHooks, [switch]$Gitignore)
$ErrorActionPreference = 'Stop'

$RepoUrl = if ($env:WORKFLOW_REPO) { $env:WORKFLOW_REPO } else { 'https://github.com/gntrs/workflow.git' }
# WORKFLOW_HOME is for the tests: it stands in for the home folder
$Root = if ($env:WORKFLOW_HOME) { $env:WORKFLOW_HOME } else { $HOME }
$Src = $PSScriptRoot
if (-not $Src -or -not (Test-Path (Join-Path $Src 'rules/RULES.md')) -or -not (Test-Path (Join-Path $Src 'SETUP.md'))) {
  $Src = Join-Path $Root '.claude/workflow'
  if (Test-Path (Join-Path $Src '.git')) {
    git -C $Src pull -q --ff-only
    if ($LASTEXITCODE -ne 0) { Write-Host "could not update $Src (git pull failed), using the copy that is there" }
  } else { git clone -q --depth 1 $RepoUrl $Src }
}

# run from the clone the one line install made: get the newest version first, then start over from it.
# a clone anywhere else (a fork, a checkout you are working in) is used as it is
$MainVersion = ''
$Managed = Join-Path $Root '.claude/workflow'
if ((Test-Path (Join-Path $Src '.git')) -and -not $env:WORKFLOW_PULLED -and ((Resolve-Path $Src).Path -eq (Resolve-Path $Managed -ErrorAction SilentlyContinue).Path)) {
  if (-not $Status -and -not $Uninstall -and -not $DryRun) {
    git -C $Src pull -q --ff-only
    if ($LASTEXITCODE -eq 0) {
      $env:WORKFLOW_PULLED = '1'
      & (Join-Path $Src 'install.ps1') @PSBoundParameters
      exit $LASTEXITCODE
    }
    Write-Host "could not update $Src (git pull failed), using the copy that is there"
  } else {
    git -C $Src fetch -q 2>$null
    if ($LASTEXITCODE -eq 0) { $MainVersion = (git -C $Src show '@{u}:VERSION' 2>$null | Out-String).Trim() }
  }
}

$Claude = Join-Path $Root '.claude'
$Manifest = Join-Path $Claude 'workflow-manifest'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = Join-Path (Join-Path $Claude 'workflow-backups') $Stamp
$VersionFile = Join-Path $Src 'VERSION'
$Version = if (Test-Path $VersionFile) { (Get-Content $VersionFile -TotalCount 1 -Encoding UTF8).Trim() } else { 'unknown' }
$Ours = 'bbq','brain','cook','deep','design','dream','initiate','playbook','review','ship','status','write'
$script:Did = @(); $script:Skipped = @(); $script:Moved = @()
$script:NewMan = [ordered]@{}

# the manifest and the known hashes, read once
$script:Recorded = [ordered]@{}; $script:Had = ''
if (Test-Path $Manifest) {
  foreach ($line in Get-Content $Manifest -Encoding UTF8) {
    if ($line -match '^# workflow (.+)$') { if (-not $script:Had) { $script:Had = $Matches[1].Trim() }; continue }
    if ($line -match '^#' -or -not $line.Trim()) { continue }
    $parts = $line -split '\s+', 2
    if ($parts.Count -eq 2) { $script:Recorded[$parts[1].Trim()] = $parts[0] }
  }
}
$Known = @{}
$knownFile = Join-Path $Src 'setup/known-hashes.txt'
if (Test-Path $knownFile) { foreach ($k in Get-Content $knownFile) { if ($k.Trim()) { $Known[$k.Trim()] = $true } } }

function Ask($q) {
  if ($Yes) { return $true }
  if ([Console]::IsInputRedirected) { return $false }
  $r = Read-Host "$q [y/N]"; return ($r -eq 'y' -or $r -eq 'Y')
}
# -Yes never turns an optional part on
function Opt([bool]$flag, $q) { if ($flag) { return $true }; if ($Yes) { return $false }; return (Ask $q) }
function Sha($path) { return (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLower() }
function Dest($rel) { return (Join-Path $Claude $rel) }
# new | same | clean (yours matches a copy we shipped) | edited
function State($srcFile, $rel) {
  $dest = Dest $rel
  if (-not (Test-Path -LiteralPath $dest)) { return 'new' }
  $h = Sha $dest
  if ($h -eq (Sha $srcFile)) { return 'same' }
  if (($script:Recorded.Contains($rel) -and $script:Recorded[$rel] -eq $h) -or $Known.ContainsKey($h)) { return 'clean' }
  return 'edited'
}
# true when REL or a folder above it inside ~\.claude is a link (your own copy, kept elsewhere)
function Linked($rel) {
  $p = $Claude
  foreach ($part in ($rel -split '/')) {
    $p = Join-Path $p $part
    $item = Get-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
    if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $true }
  }
  return $false
}
function Move-ToBackup($rel) {
  if ($DryRun) { return }
  $to = Join-Path $Backup $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $to -Parent) | Out-Null
  Move-Item -LiteralPath (Dest $rel) -Destination $to -Force
}
# every file of a source file or folder as @{ Src; Rel }, rel always with forward slashes
function Pairs($src, $rel) {
  if (Test-Path -LiteralPath $src -PathType Container) {
    $base = (Resolve-Path -LiteralPath $src).Path.TrimEnd('\', '/')
    return @(Get-ChildItem -LiteralPath $src -Recurse -File | Where-Object { $_.Name -ne '.DS_Store' } | Sort-Object FullName | ForEach-Object {
      $sub = $_.FullName.Substring($base.Length + 1) -replace '\\', '/'
      @{ Src = $_.FullName; Rel = "$rel/$sub" }
    })
  }
  return @(@{ Src = $src; Rel = $rel })
}
# one skill folder or one file, all or nothing. a group with a file you edited is left alone and named, unless -Force or you say yes
function Install-Group($label, $src, $rel) {
  if (Linked $rel) { $script:Skipped += "${label}: a link to your own copy, left alone"; return }
  $pairs = Pairs $src $rel
  $edited = @($pairs | Where-Object { (State $_.Src $_.Rel) -eq 'edited' } | ForEach-Object { if ($_.Rel -eq $rel) { $_.Rel } else { $_.Rel.Substring($rel.Length + 1) } })
  if ($edited.Count) {
    $names = $edited -join ' '
    if (-not ($Force -or ((-not $Yes) -and (Ask "$label has your edits ($names). replace it? your copy goes to workflow-backups\")))) {
      $script:Skipped += "${label}: you edited $names. kept yours. -Force replaces it, your copy goes to workflow-backups\"
      return
    }
  }
  $changed = $false
  foreach ($p in $pairs) {
    $st = State $p.Src $p.Rel
    if ($st -eq 'edited') { Move-ToBackup $p.Rel; $script:Moved += $p.Rel }
    if ($st -ne 'same') {
      $changed = $true
      if (-not $DryRun) {
        $to = Dest $p.Rel
        New-Item -ItemType Directory -Force -Path (Split-Path $to -Parent) | Out-Null
        Copy-Item -LiteralPath $p.Src -Destination $to -Force
      }
    }
    $script:NewMan[$p.Rel] = Sha $p.Src
  }
  # a file we installed before that is gone from the source: move it out if you did not edit it
  if (Test-Path -LiteralPath $src -PathType Container) {
    $have = @{}; foreach ($p in $pairs) { $have[$p.Rel] = $true }
    foreach ($d in @($script:Recorded.Keys)) {
      if (-not $d.StartsWith("$rel/") -or $have.ContainsKey($d)) { continue }
      $f = Dest $d
      if ((Test-Path -LiteralPath $f) -and (Sha $f) -eq $script:Recorded[$d]) { Move-ToBackup $d; $script:Moved += "$d (gone from the source)"; $changed = $true }
    }
  }
  if ($changed) { $script:Did += $label }
}
function Write-Manifest {
  if ($DryRun) { return }
  $lines = @("# workflow $Version", '# files this installer put in ~/.claude and their sha256. it uses this to tell your edits from its own old copies. do not edit.')
  foreach ($k in $script:NewMan.Keys) { $lines += "$($script:NewMan[$k])  $k" }
  foreach ($k in $script:Recorded.Keys) {
    if ($script:NewMan.Contains($k)) { continue }
    if (Test-Path -LiteralPath (Dest $k)) { $lines += "$($script:Recorded[$k])  $k" }
  }
  [IO.File]::WriteAllText($Manifest, (($lines -join "`n") + "`n"))
}
# node writes a warning to stderr now and then. under Stop on powershell 5.1 that would end the script
function Run-Node {
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { $out = (& node @args 2>$null | Out-String).Trim() } finally { $ErrorActionPreference = $old }
  return $out
}
function Settings-Merge($label, $frag) {
  $settings = Join-Path $Claude 'settings.json'
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $script:Skipped += "${label}: needs node to merge settings.json. add the block in $frag by hand"; return }
  $helper = Join-Path $Src 'setup/merge-settings.mjs'
  $need = Run-Node $helper $settings $frag --check
  if ($LASTEXITCODE -ne 0) { $script:Skipped += "${label}: $need"; return }
  if ($need -eq 'same') { return }
  if (-not $DryRun) {
    if (Test-Path $settings) { New-Item -ItemType Directory -Force -Path $Backup | Out-Null; Copy-Item $settings (Join-Path $Backup 'settings.json') -Force }
    Run-Node $helper $settings $frag | Out-Null
  }
  $script:Did += $label
}
# every @{ Src; Rel } the installer keeps up to date and that is installed here
function Groups {
  $all = @(@{ Src = (Join-Path $Src 'rules/RULES.md'); Rel = 'RULES.md' })
  Get-ChildItem (Join-Path $Src 'skills') -Directory | Sort-Object Name | ForEach-Object {
    if (Test-Path (Dest "skills/$($_.Name)")) { $all += Pairs $_.FullName "skills/$($_.Name)" }
  }
  foreach ($t in 'responsive-probe.js','probe-test.mjs','brand-check.mjs','ref-read.mjs','ref-check.mjs','record.mjs') { $all += @{ Src = (Join-Path $Src "tools/$t"); Rel = "tools/$t" } }
  if (Test-Path (Dest 'skills/pstack')) { foreach ($f in 'install.sh','README.md') { $all += @{ Src = (Join-Path $Src "pstack/$f"); Rel = "skills/pstack/$f" } } }
  return $all
}
function Read-Lines($path) { if (Test-Path $path) { return @(Get-Content $path -Encoding UTF8) } else { return @() } }

# ---- status: read only
if ($Status) {
  $haveText = if ($script:Had) { $script:Had } else { 'none recorded (never installed, or installed before updates were tracked)' }
  Write-Host "installed: $haveText"
  Write-Host "source:    $Version, $Src"
  if ($MainVersion) { Write-Host ("main:      $MainVersion" + $(if ($MainVersion -ne $Version) { ', newer than the source here. the installer pulls it' } else { '' })) }
  $behind = 0; $editedCount = 0
  if (Test-Path $Claude) {
    foreach ($p in (Groups)) {
      if (-not (Test-Path -LiteralPath (Dest $p.Rel))) { if ($p.Rel.StartsWith('skills/')) { $behind++ }; continue }
      if (Linked $p.Rel) { continue }
      switch (State $p.Src $p.Rel) {
        'clean' { $behind++ }
        'edited' { $editedCount++; Write-Host "edited:    $($p.Rel)" }
      }
    }
  }
  Write-Host "$behind files behind the source, $editedCount edited by you. run the installer to update the ones you did not edit."
  exit 0
}

# ---- uninstall: moves, never deletes
if ($Uninstall) {
  if (-not (Test-Path $Manifest)) { Write-Host "nothing to uninstall: there is no $Manifest, so nothing here is tracked as installed."; exit 1 }
  $kept = @(); $n = 0
  foreach ($d in @($script:Recorded.Keys)) {
    $f = Dest $d
    if (-not (Test-Path -LiteralPath $f)) { continue }
    if (Linked $d) { $kept += "$d (a link to your own copy)" }
    elseif ((Sha $f) -eq $script:Recorded[$d]) { $n++; Move-ToBackup $d }
    else { $kept += $d }
  }
  if (-not $DryRun) {
    foreach ($dir in 'skills','tools','hooks') {
      $full = Join-Path $Claude $dir
      if (-not (Test-Path $full)) { continue }
      @(Get-ChildItem $full -Recurse -Directory) + @(Get-Item $full) | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
        if (-not (Get-ChildItem -LiteralPath $_.FullName -Force)) { Remove-Item -LiteralPath $_.FullName }
      }
    }
    New-Item -ItemType Directory -Force -Path $Backup | Out-Null
    $cm = Join-Path $Claude 'CLAUDE.md'
    if (Test-Path $cm) {
      Copy-Item $cm (Join-Path $Backup 'CLAUDE.md') -Force
      $keep = @(Read-Lines $cm | Where-Object { $_ -ne '@RULES.md' -and $_ -ne '@RULES.local.md' })
      if (@($keep | Where-Object { $_.Trim() }).Count) { [IO.File]::WriteAllText($cm, (($keep -join "`n") + "`n")) } else { Remove-Item -LiteralPath $cm }
    }
    Move-Item -LiteralPath $Manifest -Destination (Join-Path $Backup 'workflow-manifest') -Force
  }
  Write-Host ""
  if ($DryRun) { Write-Host "would move $n files to workflow-backups\ and take the two import lines out of CLAUDE.md. nothing changed." }
  else { Write-Host "uninstalled. the $n files it moved are in $Backup" }
  foreach ($k in $kept) { Write-Host "kept, you edited it: $k" }
  Write-Host "left alone: RULES.local.md (yours), the ask list in settings.json, skills/pstack/models.md, ~\vault, the pstack plugin (claude plugin uninstall pstack@open-pstack)."
  exit 0
}

# ---- install or update
$Pstack = Opt $WithPstack 'install pstack, the plugin cook runs on (recommended)?'
$Brain = Opt $WithBrain 'install the brain (a notes vault at ~\vault, /brain and /dream)?'
$Perms = Opt $WithPermissions 'make claude code ask before every push, merge, pr, release and deploy command (recommended)?'
$Ignore = Opt $Gitignore 'add the per repo notes files (.claude/CLAUDE.md, log.md, tbd.md, plans/ ...) to your global gitignore?'

if (-not $DryRun) { New-Item -ItemType Directory -Force -Path (Join-Path $Claude 'skills'), (Join-Path $Claude 'tools') | Out-Null }

# 0. older versions left <name>.bak-<date> copies inside skills\, where they can load as a second skill. move them out
foreach ($n in $Ours) {
  Get-ChildItem (Join-Path $Claude 'skills') -Filter "$n.bak-*" -ErrorAction SilentlyContinue | ForEach-Object {
    Move-ToBackup "skills/$($_.Name)"; $script:Moved += "skills/$($_.Name) (an old backup)"
  }
}
Get-ChildItem $Claude -Filter 'RULES.md.bak-*' -File -ErrorAction SilentlyContinue | ForEach-Object {
  Move-ToBackup $_.Name; $script:Moved += "$($_.Name) (an old backup)"
}

# 1. rules. yours to read, not to edit: what is personal goes in RULES.local.md
Install-Group 'RULES.md' (Join-Path $Src 'rules/RULES.md') 'RULES.md'
if (-not (Test-Path (Dest 'RULES.local.md'))) {
  if ($DryRun) { Write-Host 'would: create RULES.local.md' } else { Copy-Item (Join-Path $Src 'setup/RULES.local.md') (Dest 'RULES.local.md') }
  $script:Did += 'RULES.local.md (yours from now on)'
}

# 2. the import lines, appended, never replacing anything
$cm = Join-Path $Claude 'CLAUDE.md'
foreach ($line in '@RULES.md', '@RULES.local.md') {
  $has = @(Read-Lines $cm | Where-Object { $_ -eq $line }).Count -gt 0
  if ($has) { continue }
  if ($DryRun) { Write-Host "would: append '$line' to $cm" }
  else {
    # a fresh file gets the line alone, an existing one gets it after a blank line
    $old = if (Test-Path $cm) { [IO.File]::ReadAllText($cm) } else { '' }
    if ($old.Length -gt 0 -and -not $old.EndsWith("`n")) { $old += "`n" }
    $lead = if ($old.Length -gt 0) { "`n" } else { '' }
    [IO.File]::WriteAllText($cm, "$old$lead$line`n")
  }
  $script:Did += "CLAUDE.md: $line"
}

# 3. skills
Get-ChildItem (Join-Path $Src 'skills') -Directory | Sort-Object Name | ForEach-Object {
  $name = $_.Name
  if (($name -eq 'brain' -or $name -eq 'dream') -and -not $Brain -and -not (Test-Path (Dest "skills/$name"))) { return }
  Install-Group "skills/$name" $_.FullName "skills/$name"
}

# 4. the size sweep probe, its runner, the brand check, the ref reader and its gate, and the recorder
foreach ($t in 'responsive-probe.js','probe-test.mjs','brand-check.mjs','ref-read.mjs','ref-check.mjs','record.mjs') {
  Install-Group "tools/$t" (Join-Path $Src "tools/$t") "tools/$t"
}

# 5. optional: keep the per repo notes files out of every repo. exact paths, never all of .claude/
$Notes = '.claude/CLAUDE.md','.claude/log.md','.claude/tbd.md','.claude/taste.md','.claude/brand.md','.claude/plans/','.claude/research/','.claude/sql/','.claude/run/','.claude/videos/'
if ($Ignore -and (Get-Command git -ErrorAction SilentlyContinue)) {
  $gi = git config --global core.excludesFile
  if (-not $gi) {
    $gi = Join-Path $Root '.gitignore_global'
    if ($DryRun) { Write-Host 'would: set core.excludesFile' } else { git config --global core.excludesFile $gi }
  }
  $gi = $gi -replace '^~', $Root
  $have = Read-Lines $gi
  $missing = @($Notes | Where-Object { $have -notcontains $_ })
  if ($missing.Count) {
    if ($DryRun) { Write-Host "would: append notes files to $gi" } else { $old = if (Test-Path $gi) { [IO.File]::ReadAllText($gi) } else { '' }; $lead = if ($old.Length -gt 0 -and -not $old.EndsWith("`n")) { "`n" } else { '' }; [IO.File]::AppendAllText($gi, ($lead + ($missing -join "`n") + "`n")) }
    $script:Did += 'global gitignore: notes files'
  }
}

# 6. optional: ask before anything leaves. merged into settings.json, the old file goes to workflow-backups\
if ($Perms) { Settings-Merge 'settings.json: ask before push, merge, pr, release, deploy' (Join-Path $Src 'setup/permissions.json') }

# 7. the node_modules hook is a bash script
if ($WithHooks) { $script:Skipped += 'the node_modules hook: a bash script, not installed on windows. use wsl and install.sh for it' }

# 8. optional: pstack
if ($Pstack -or (Test-Path (Dest 'skills/pstack'))) {
  foreach ($f in 'install.sh','README.md') { Install-Group "skills/pstack/$f" (Join-Path $Src "pstack/$f") "skills/pstack/$f" }
  # models.md holds your model names: created once, never written again
  if (-not (Test-Path (Dest 'skills/pstack/models.md'))) {
    if (-not $DryRun) {
      New-Item -ItemType Directory -Force -Path (Dest 'skills/pstack') | Out-Null
      Copy-Item (Join-Path $Src 'pstack/models.md') (Dest 'skills/pstack/models.md')
    }
    $script:Did += 'skills/pstack/models.md (yours from now on)'
  }
}
if ($Pstack) {
  if (Get-Command claude -ErrorAction SilentlyContinue) {
    if ($DryRun) { Write-Host 'would: install the pstack plugin' }
    else {
      $tag = (Select-String -Path (Join-Path $Src 'pstack/install.sh') -Pattern '^TAG="(.+)"').Matches[0].Groups[1].Value
      # an install from an older pin keeps its marketplace entry: drop it, add it at this tag
      if ((claude plugin marketplace list 2>$null | Out-String) -match 'open-pstack') { claude plugin marketplace remove open-pstack }
      claude plugin marketplace add "https://github.com/ericlitman/open-pstack.git#$tag"
      claude plugin install pstack@open-pstack
      claude plugin update pstack@open-pstack
      if (@(Read-Lines $cm | Where-Object { $_ -eq '@skills/pstack/models.md' }).Count -eq 0) { [IO.File]::AppendAllText($cm, "`n@skills/pstack/models.md`n") }
    }
    $script:Did += 'the pstack plugin'
  } else { $script:Skipped += 'pstack plugin: no claude cli on PATH' }
}

# 9. the brain
if ($Brain) {
  $vault = Join-Path $Root 'vault'
  if (Test-Path $vault) { $script:Skipped += '~\vault exists, left as is' }
  else {
    if ($DryRun) { Write-Host 'would: create ~\vault' } else { Copy-Item (Join-Path $Src 'brain-template') $vault -Recurse }
    $script:Did += '~\vault'
  }
}

Write-Manifest

Write-Host ""
$label = if ($DryRun) { 'would install or update: ' } else { 'installed or updated: ' }
Write-Host ($label + $(if ($script:Did.Count) { $script:Did -join ' ' } else { 'nothing, all up to date' }))
foreach ($s in $script:Skipped) { Write-Host "skipped: $s" }
if ($script:Moved.Count) {
  if ($DryRun) { Write-Host ('would move to workflow-backups\: ' + ($script:Moved -join ' ')) } else { Write-Host ("moved to ${Backup}: " + ($script:Moved -join ' ')) }
}
if ($script:Had -and $script:Had -ne $Version) { Write-Host "version: $($script:Had) to $Version. what changed: $(Join-Path $Src 'CHANGELOG.md')" } else { Write-Host "version: $Version" }
Write-Host "next: restart claude code, then type /cook <a real task>."
