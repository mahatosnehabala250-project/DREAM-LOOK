#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev 2>&1 | tee -a dev.log
  echo "Server died, restarting in 2s..." >> dev.log
  sleep 2
done
