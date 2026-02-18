(function () {
  var list = document.getElementById("dir-list");
  if (!list) return;

  var params = new URLSearchParams(window.location.search);
  var sortBy = params.get("sort") || "date";
  var entries = Array.prototype.slice.call(list.querySelectorAll(".dir-entry"));
  if (!entries.length) return;

  entries.sort(function (a, b) {
    if (sortBy === "name") {
      return (a.dataset.name || "").localeCompare(b.dataset.name || "");
    }
    if (sortBy === "size") {
      return Number(b.dataset.size || 0) - Number(a.dataset.size || 0);
    }
    if (sortBy === "type") {
      return (a.dataset.type || "").localeCompare(b.dataset.type || "");
    }
    return Number(b.dataset.date || 0) - Number(a.dataset.date || 0);
  });

  entries.forEach(function (entry) {
    list.appendChild(document.createTextNode("\n"));
    list.appendChild(entry);
  });
  list.appendChild(document.createTextNode("\n"));
})();
