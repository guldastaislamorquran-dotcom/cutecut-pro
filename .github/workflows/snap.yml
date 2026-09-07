name: Verify Snap (libnspr)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  verify-snap:
    name: Build snap and verify libnspr4
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: npm

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            fakeroot \
            dpkg \
            libfuse2 \
            squashfs-tools \
            snapd \
            build-essential \
            python3

      - name: Install Node dependencies
        run: |
          npm ci

      - name: Apply persistent Snap launcher patch
        run: |
          node scripts/patch-snap-launcher.cjs

      - name: Build Snap
        env:
          CSC_IDENTITY_AUTO_DISCOVERY: false
        run: |
          rm -rf dist-desktop
          npx electron-builder build --linux snap --x64 --publish never

      - name: Locate Snap
        id: find_snap
        run: |
          set -euo pipefail

          SNAP_FILE=$(find dist-desktop -maxdepth 1 -type f -name '*.snap' | head -n 1)

          if [ -z "$SNAP_FILE" ]; then
            echo "ERROR: No .snap file was produced."
            exit 1
          fi

          echo "Found Snap: $SNAP_FILE"
          echo "SNAP_FILE=$SNAP_FILE" >> "$GITHUB_OUTPUT"

          mkdir -p verification
          echo "snap_file=$SNAP_FILE" > verification/snap_info.txt

      - name: Unsquash Snap
        run: |
          set -euo pipefail

          SNAP_FILE="${{ steps.find_snap.outputs.SNAP_FILE }}"

          rm -rf snap-root
          mkdir -p snap-root

          unsquashfs -d snap-root "$SNAP_FILE"

          echo "Snap successfully unsquashed."

      - name: Verify libnspr4.so
        run: |
          set -euo pipefail

          mkdir -p verification

          find snap-root -type f -name 'libnspr4.so*' -print \
            | tee verification/libnspr_paths.txt

          if ! find snap-root -type f -name 'libnspr4.so*' | grep -q .; then
            echo "FAIL: libnspr4.so was NOT found inside the Snap."
            exit 1
          fi

          echo "PASS: libnspr4.so is present inside the Snap."

      - name: Verify Electron executable
        run: |
          set -euo pipefail

          find snap-root -type f -name 'cutecut-pro' -executable -print \
            | tee verification/executables.txt

          if ! find snap-root -type f -name 'cutecut-pro' -executable | grep -q .; then
            echo "FAIL: cutecut-pro executable not found."
            exit 1
          fi

          echo "PASS: cutecut-pro executable found."

      - name: Verify Snap launcher
        run: |
          set -euo pipefail

          echo "=== command.sh ===" | tee verification/launcher.txt
          cat snap-root/command.sh | tee -a verification/launcher.txt

          if grep -q 'desktop-init.sh' snap-root/command.sh; then
            echo "FAIL: launcher still depends on desktop-init.sh"
            exit 1
          fi

          if grep -q -- '--no-sandbox' snap-root/command.sh; then
            echo "FAIL: launcher still contains --no-sandbox"
            exit 1
          fi

          echo "PASS: launcher has no desktop-init dependency and no forced --no-sandbox."

      - name: Run ldd verification
        run: |
          set -euo pipefail

          mkdir -p verification

          LIBNSPR_DIR=$(dirname "$(find snap-root -type f -name 'libnspr4.so*' | head -n 1)")

          export LD_LIBRARY_PATH="$LIBNSPR_DIR:$(pwd)/snap-root/usr/lib:$(pwd)/snap-root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

          EXE=$(find snap-root -type f -name 'cutecut-pro' -executable | head -n 1)

          echo "Executable: $EXE"
          echo "LD_LIBRARY_PATH: $LD_LIBRARY_PATH"

          ldd "$EXE" 2>&1 | tee verification/ldd_output.txt

          if ldd "$EXE" 2>&1 | grep -E 'libnspr4\.so.*not found'; then
            echo "FAIL: libnspr4.so is still unresolved."
            exit 1
          fi

          echo "PASS: ldd does not report libnspr4.so as missing."

      - name: Test Electron binary
        run: |
          set -euo pipefail

          mkdir -p verification

          LIBNSPR_DIR=$(dirname "$(find snap-root -type f -name 'libnspr4.so*' | head -n 1)")
          EXE=$(find snap-root -type f -name 'cutecut-pro' -executable | head -n 1)

          export LD_LIBRARY_PATH="$LIBNSPR_DIR:$(pwd)/snap-root/usr/lib:$(pwd)/snap-root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

          set +e
          "$EXE" --version > verification/run_output.txt 2>&1
          STATUS=$?
          set -e

          cat verification/run_output.txt

          echo "Electron binary exit code: $STATUS" | tee -a verification/run_output.txt

          if grep -qiE 'libnspr4\.so.*cannot open|error while loading shared libraries.*libnspr4' verification/run_output.txt; then
            echo "FAIL: runtime still cannot load libnspr4.so."
            exit 1
          fi

          echo "PASS: runtime did not report missing libnspr4.so."

      - name: Save verification summary
        if: always()
        run: |
          mkdir -p verification

          {
            echo "Snap verification"
            echo "================="
            echo "Commit: $GITHUB_SHA"
            echo "Run: $GITHUB_RUN_ID"
            echo
            echo "libnspr4 paths:"
            cat verification/libnspr_paths.txt 2>/dev/null || true
            echo
            echo "Executables:"
            cat verification/executables.txt 2>/dev/null || true
          } > verification/SUMMARY.txt

      - name: Upload verification artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: snap-verification-${{ github.run_id }}
          path: |
            verification/**
            dist-desktop/*.snap
          if-no-files-found: warn
