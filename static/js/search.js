(function () {
  var input = document.getElementById("q");
  var out = document.getElementById("search-results");
  if (!input || !out) return;

  function render(lines) {
    out.textContent = lines.join("\n");
  }

  function normalize(s) {
    return (s || "").toLowerCase();
  }

  var params = new URLSearchParams(window.location.search);
  var query = (params.get("q") || "").trim();
  if (query) input.value = query;

  fetch("/index.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (items) {
      if (!query) {
        render(["No query yet.", "", "Try: web, weird, archive"]);
        return;
      }

      var q = normalize(query);
      var results = items.filter(function (item) {
        return (
          normalize(item.title).includes(q) ||
          normalize(item.content).includes(q)
        );
      });

      if (!results.length) {
        render(["No matches for: " + query]);
        return;
      }

      var lines = ["Matches for: " + query, ""];
      results.slice(0, 50).forEach(function (item) {
        lines.push("- " + item.date + "  " + item.title);
        lines.push("  " + item.url);
      });
      render(lines);
    })
    .catch(function () {
      render(["Search index could not be loaded."]);
    });
})();
