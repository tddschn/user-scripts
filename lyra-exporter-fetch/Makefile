download-from-greasyfork:
	curl_download_slugified_filename.py -k https://update.greasyfork.org/scripts/539579/Lyra%20Exporter%20Fetch%20%28One-Click%20AI%20Chat%20Backup%29.user.js

download-header:
	curl_download_slugified_filename.py -k https://update.greasyfork.org/scripts/539579/Lyra%20Exporter%20Fetch%20%28One-Click%20AI%20Chat%20Backup%29.meta.js

extract-header:
	<Lyra-Exporter-Fetch-One-Click-AI-Chat-Backup.user.js extract_text_by_markers.py -e '// ==/UserScript==' >userscript-header.js

create-frozen-user-js:
	userscript_disable_autoupdate.py Lyra-Exporter-Fetch-One-Click-AI-Chat-Backup.user.js -o frozen.user.js

.PHONY: download-from-greasyfork download-header extract-header create-frozen-user-js