// ==UserScript==
// @name         Filter and Sort HTML Tables
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds filtering and sorting capabilities to standard HTML tables on any page.
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Function to make table columns sortable
  function makeTableSortable(table) {
    const headers = table.querySelectorAll("th");
    headers.forEach((header, index) => {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        sortTable(table, index);
      });
    });
  }

  // Function to sort the table
  function sortTable(table, columnIndex) {
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const isAscending = !table.classList.contains("sorted-asc");

    rows.sort((a, b) => {
      const aText = a.children[columnIndex].innerText.trim();
      const bText = b.children[columnIndex].innerText.trim();

      return (
        aText.localeCompare(bText, undefined, { numeric: true }) *
        (isAscending ? 1 : -1)
      );
    });

    tbody.innerHTML = "";
    rows.forEach((row) => tbody.appendChild(row));

    table.classList.toggle("sorted-asc", isAscending);
  }

  // Function to add a filter input to the table
  function addTableFilter(table) {
    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.placeholder = "Filter table...";
    filterInput.addEventListener("input", () => {
      filterTable(table, filterInput.value.toLowerCase());
    });
    table.parentNode.insertBefore(filterInput, table);
  }

  // Function to filter the table
  function filterTable(table, filterText) {
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(filterText) ? "" : "none";
    });
  }

  // Find all tables on the page and apply the enhancements
  const tables = document.querySelectorAll("table");
  tables.forEach((table) => {
    addTableFilter(table);
    makeTableSortable(table);
  });
})();
