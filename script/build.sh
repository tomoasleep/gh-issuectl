#!/bin/bash
set -e
bun build ./src/index.ts --outdir ./dist --target node
