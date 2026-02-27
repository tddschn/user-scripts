#!/usr/bin/env bash



# https://gemini.google.com/app/5ec2bc6d93aedbef

# 1. Update the URL (keep the trailing slash)
sd "EXPORTER_URL: 'https://yalums\.github\.io/lyra-exporter/'" "EXPORTER_URL: 'http://localhost:10985/'" "${1}"

# 2. Update the ORIGIN (strip the trailing slash)
sd "EXPORTER_ORIGIN: 'https://yalums\.github\.io'" "EXPORTER_ORIGIN: 'http://localhost:10985'" "${1}"