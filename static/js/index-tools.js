(function () {
  var list = document.getElementById("dir-list");
  if (!list) return;

  var params = new URLSearchParams(window.location.search);
  var sortBy = params.get("sort") || "date";
  var order = params.get("order") || "desc";
  if (order !== "asc" && order !== "desc") order = "desc";

  var linksRoot = document.getElementById("sort-links");
  if (linksRoot) {
    var links = linksRoot.querySelectorAll("a[data-sort]");
    Array.prototype.forEach.call(links, function (link) {
      var key = link.getAttribute("data-sort");
      var nextOrder = "desc";
      if (sortBy === key) {
        nextOrder = order === "desc" ? "asc" : "desc";
        link.textContent = key + (order === "desc" ? " ↓" : " ↑");
      }
      link.setAttribute("href", "?sort=" + key + "&order=" + nextOrder);
    });
  }

  var entries = Array.prototype.slice.call(list.querySelectorAll(".dir-entry"));
  if (!entries.length) return;

  entries.sort(function (a, b) {
    var cmp = 0;
    if (sortBy === "name") {
      cmp = (a.dataset.name || "").localeCompare(b.dataset.name || "");
    } else if (sortBy === "size") {
      cmp = Number(a.dataset.size || 0) - Number(b.dataset.size || 0);
    } else if (sortBy === "type") {
      cmp = (a.dataset.type || "").localeCompare(b.dataset.type || "");
    } else {
      cmp = Number(a.dataset.date || 0) - Number(b.dataset.date || 0);
    }

    return order === "asc" ? cmp : -cmp;
  });

  entries.forEach(function (entry) {
    list.appendChild(document.createTextNode("\n"));
    list.appendChild(entry);
  });
  list.appendChild(document.createTextNode("\n"));
})();
