#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
dotnet publish windows/Bunko.Windows.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true -p:DebugType=None -o release/windows-1.0.15-single-x64 -m:1
