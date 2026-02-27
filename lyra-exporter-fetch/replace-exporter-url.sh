#!/usr/bin/env bash



# https://gemini.google.com/app/5ec2bc6d93aedbef

fastmod -m \
    "(EXPORTER_(?:URL|ORIGIN):) 'https://yalums\.github\.io(?:-exporter/)?'" \
    '${1} '"'http://localhost:10985/'" \
    "${1}"