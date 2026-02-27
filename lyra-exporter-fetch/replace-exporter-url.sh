#!/usr/bin/env bash



# https://gemini.google.com/app/5ec2bc6d93aedbef

# This regex uses capture groups to target the specific key and strip the slash
fastmod -m \
    "(EXPORTER_URL|EXPORTER_ORIGIN): 'https://yalums\.github\.io(?:/lyra-exporter/)?'" \
    '${1}: ${1#*URL?http://localhost:10985/:http://localhost:10985}' \
    "${@}"