// ==UserScript==
// @name         PyPI Project Stats & History
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds download statistics (from pypistats.org) and recent release history to PyPI project pages.
// @author       You
// @match        https://pypi.org/project/*
// @icon         https://pypi.org/static/images/favicon.35549fe8.ico
// @grant        GM_xmlhttpRequest
// @connect      pypistats.org
// @connect      pypi.org
// ==/UserScript==

(function () {
  "use strict";

  // 1. Get Package Name from URL
  // URL format: https://pypi.org/project/<package_name>/...
  const pathParts = window.location.pathname.split("/");
  const packageName = pathParts[2]; // index 0 is empty, 1 is 'project'

  if (!packageName) return;

  // 2. Create UI Shell (Native PyPI Look)
  // We insert this into the sidebar
  const sidebar = document.querySelector(
    ".vertical-tabs__tabs .sidebar-section",
  ).parentNode;
  if (!sidebar) return;

  const statsContainer = document.createElement("div");
  statsContainer.className = "sidebar-section";
  statsContainer.innerHTML = `
        <h3 class="sidebar-section__title">Statistics</h3>
        <div id="userscript-pypi-stats-loading" style="color: #666; font-style: italic;">Loading data...</div>
        <div id="userscript-pypi-stats-content" style="display:none;">
            <p><strong>Downloads (PyPI Stats):</strong></p>
            <ul class="vertical-tabs__list" style="margin-bottom: 1rem;">
                <li><span style="color:#666;">Last Day:</span> <strong id="stat-day">...</strong></li>
                <li><span style="color:#666;">Last Week:</span> <strong id="stat-week">...</strong></li>
                <li><span style="color:#666;">Last Month:</span> <strong id="stat-month">...</strong></li>
            </ul>
            <p><strong>Recent Releases:</strong></p>
            <ul class="vertical-tabs__list" id="stat-history">
            </ul>
        </div>
    `;

  // Insert after the navigation, before other sidebar sections
  const refNode = document.querySelectorAll(".sidebar-section")[0];
  sidebar.insertBefore(statsContainer, refNode.nextSibling);

  // 3. Helper Functions
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    return "Today";
  }

  function revealContent() {
    document.getElementById("userscript-pypi-stats-loading").style.display =
      "none";
    document.getElementById("userscript-pypi-stats-content").style.display =
      "block";
  }

  // 4. Fetch Download Stats (from pypistats.org)
  // We use GM_xmlhttpRequest to bypass CORS
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://pypistats.org/api/packages/${packageName}/recent`,
    onload: function (response) {
      if (response.status === 200) {
        try {
          const json = JSON.parse(response.responseText);
          const data = json.data;
          document.getElementById("stat-day").innerText = formatNumber(
            data.last_day,
          );
          document.getElementById("stat-week").innerText = formatNumber(
            data.last_week,
          );
          document.getElementById("stat-month").innerText = formatNumber(
            data.last_month,
          );
        } catch (e) {
          console.error("PyPI Userscript: Error parsing pypistats", e);
        }
      } else {
        document.getElementById("stat-day").innerText = "N/A";
      }
      revealContent(); // Reveal partial content even if one fails
    },
    onerror: function () {
      document.getElementById("stat-day").innerText = "Error";
      revealContent();
    },
  });

  // 5. Fetch Release History (from PyPI JSON API)
  // We use the JSON API because the specific release page html doesn't list historical dates easily
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://pypi.org/pypi/${packageName}/json`,
    onload: function (response) {
      if (response.status === 200) {
        try {
          const json = JSON.parse(response.responseText);
          const releases = json.releases;

          // Convert releases object to array: [{version: '1.0', date: DateObj}, ...]
          let releaseList = [];

          Object.keys(releases).forEach((version) => {
            const files = releases[version];
            if (files && files.length > 0) {
              // Find the earliest upload time for this version (sdist vs wheel)
              const dateStr = files[0].upload_time;
              releaseList.push({
                version: version,
                date: new Date(dateStr),
                url: `/project/${packageName}/${version}/`,
              });
            }
          });

          // Sort descending by date
          releaseList.sort((a, b) => b.date - a.date);

          // Take top 5
          const historyContainer = document.getElementById("stat-history");
          historyContainer.innerHTML = ""; // Clear loading

          releaseList.slice(0, 5).forEach((rel) => {
            const li = document.createElement("li");
            li.style.lineHeight = "1.4";
            li.style.marginBottom = "5px";
            li.innerHTML = `
                            <a href="${rel.url}" style="font-weight:600;">${rel.version}</a>
                            <br>
                            <span style="font-size: 0.85em; color: #666;">${rel.date.toISOString().split("T")[0]} (${timeAgo(rel.date)})</span>
                        `;
            historyContainer.appendChild(li);
          });
        } catch (e) {
          console.error("PyPI Userscript: Error parsing PyPI JSON", e);
        }
      }
      revealContent();
    },
  });
})();
