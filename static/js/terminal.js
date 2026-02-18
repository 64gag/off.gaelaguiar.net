(function () {
  var root = document.getElementById("terminal-app");
  var tabsRoot = document.getElementById("terminal-tabs");
  var dataElement = document.getElementById("terminal-data");
  var screen = root.querySelector(".terminal-screen");
  var output = document.getElementById("terminal-output");
  var form = document.getElementById("terminal-form");
  var input = document.getElementById("terminal-input");

  if (
    !root ||
    !tabsRoot ||
    !dataElement ||
    !screen ||
    !output ||
    !form ||
    !input
  ) {
    return;
  }

  var data = JSON.parse(dataElement.textContent || "{}");
  var listKey = String(data.listKey || "l").toLowerCase();
  var themeStorageKey = "terminal_theme";
  var mediaTheme = window.matchMedia("(prefers-color-scheme: light)");
  var tabState = {
    microblog: {
      type: "content",
      items: Array.isArray(data.microblog) ? data.microblog : [],
    },
    contacts: {
      type: "static",
      card: data.contact || null,
    },
    settings: {
      type: "settings",
      items: [],
    },
  };
  var currentTab = "microblog";
  var selectedTheme = "system";

  function label(value, fallback) {
    var text = String(value || fallback || "");
    return text.replace(/_/g, " ");
  }

  function tabLabel(tabKey) {
    var labels = data.tabs || {};
    return label(labels[tabKey], tabKey);
  }

  function systemTheme() {
    return mediaTheme.matches ? "light" : "dark";
  }

  function effectiveTheme(themeName) {
    if (themeName === "dark" || themeName === "light") {
      return themeName;
    }
    return systemTheme();
  }

  function applyTheme(themeName, persist) {
    var normalized =
      themeName === "dark" || themeName === "light" || themeName === "system"
        ? themeName
        : "system";
    var effective = effectiveTheme(normalized);

    selectedTheme = normalized;
    document.body.classList.toggle("theme-light", effective === "light");
    document.body.classList.toggle("theme-dark", effective === "dark");

    if (persist !== false) {
      localStorage.setItem(themeStorageKey, normalized);
    }
  }

  function loadTheme() {
    var stored = localStorage.getItem(themeStorageKey);
    applyTheme(stored || "system", false);
  }

  function buildSettingsItems() {
    var items = [];
    var languageLabel = label(data.languageLabel, "language");
    var themeLabel = label(data.themeLabel, "theme");
    var languages = Array.isArray(data.languages) ? data.languages : [];

    languages.forEach(function (item) {
      var state = item.active ? " *" : "";
      items.push({
        title: languageLabel + ": " + item.title + state,
        kind: "language",
        url: item.url,
      });
    });

    [
      {
        theme: "system",
        label: label(data.themeSystemLabel, "system"),
      },
      {
        theme: "dark",
        label: label(data.themeDarkLabel, "dark"),
      },
      {
        theme: "light",
        label: label(data.themeLightLabel, "light"),
      },
    ].forEach(function (item) {
      var state = item.theme === selectedTheme ? " *" : "";
      items.push({
        title: themeLabel + ": " + item.label + state,
        kind: "theme",
        theme: item.theme,
      });
    });

    tabState.settings.items = items;
  }

  function scrollToBottom() {
    screen.scrollTop = screen.scrollHeight;
  }

  function appendLine(text, className) {
    var line = document.createElement("div");
    line.className = className ? "terminal-line " + className : "terminal-line";
    line.textContent = text;
    output.appendChild(line);
    scrollToBottom();
  }

  function appendBlock(text) {
    var block = document.createElement("pre");
    block.className = "terminal-block";
    block.textContent = text;
    output.appendChild(block);
    scrollToBottom();
  }

  function appendContactRow(labelText, valueText) {
    var row = document.createElement("div");
    row.className = "terminal-line";

    var labelSpan = document.createElement("span");
    labelSpan.className = "terminal-label-inline";
    labelSpan.textContent = labelText + ": ";

    var valueSpan = document.createElement("span");
    valueSpan.textContent = valueText;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    output.appendChild(row);
  }

  function buildExternalLink(href, text) {
    var link = document.createElement("a");
    link.className = "terminal-link";
    link.href = href;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    link.textContent = text;
    return link;
  }

  function appendContactProfiles(card) {
    var row = document.createElement("div");
    row.className = "terminal-line";

    var labelSpan = document.createElement("span");
    labelSpan.className = "terminal-label-inline";
    labelSpan.textContent = label(data.contactProfilesLabel, "Profiles") + ": ";
    row.appendChild(labelSpan);

    var links = [];
    if (card.github) {
      links.push(buildExternalLink(card.github, "GitHub"));
    }
    if (card.linkedin) {
      links.push(buildExternalLink(card.linkedin, "LinkedIn"));
    }
    if (card.calendar) {
      links.push(buildExternalLink(card.calendar, "Google Calendar"));
    }

    links.forEach(function (link, idx) {
      if (idx > 0) {
        row.appendChild(document.createTextNode(" | "));
      }
      row.appendChild(link);
    });

    if (card.calendar) {
      row.appendChild(document.createTextNode(" "));
      var noteLink = document.createElement("a");
      noteLink.className = "terminal-link";
      noteLink.href = "#" + label(data.contactCallNoteId, "contact-call-note");
      noteLink.textContent = "*";
      row.appendChild(noteLink);
    }

    output.appendChild(row);
  }

  function appendContactCard() {
    var card = tabState.contacts.card || {};
    var languages = Array.isArray(card.languages) ? card.languages : [];
    var hasContent = Boolean(
      card.role ||
      card.intro ||
      card.email ||
      languages.length ||
      card.github ||
      card.linkedin ||
      card.calendar ||
      card.availability,
    );

    if (!hasContent) {
      appendLine(label(data.emptyLabel, "No entries"), "terminal-error");
      return;
    }

    if (card.role) {
      appendContactRow(label(data.contactRoleLabel, "Role"), card.role);
      appendLine("", "terminal-spacer");
      appendLine("", "terminal-spacer");
    }
    if (card.intro) {
      appendLine(card.intro, "terminal-line");
      appendLine("", "terminal-spacer");
      appendLine("", "terminal-spacer");
    }
    if (card.email) {
      appendContactRow(label(data.contactEmailLabel, "Email"), card.email);
      appendLine("", "terminal-spacer");
    }
    if (card.github || card.linkedin || card.calendar) {
      appendContactProfiles(card);
      appendLine("", "terminal-spacer");
      appendLine("", "terminal-spacer");
    }
    if (languages.length) {
      appendContactRow(
        label(data.contactLanguagesLabel, "Contact languages"),
        languages.join(", "),
      );
      appendLine("", "terminal-spacer");
      appendLine("", "terminal-spacer");
    }
    if (card.availability) {
      var note = document.createElement("div");
      note.className = "terminal-line terminal-hint";
      note.id = label(data.contactCallNoteId, "contact-call-note");

      var noteLabel = document.createElement("span");
      noteLabel.className = "terminal-label-inline";
      noteLabel.textContent =
        label(data.contactAvailabilityLabel, "Availability") + ": ";

      var noteText = document.createElement("span");
      noteText.textContent = card.availability;

      note.appendChild(noteLabel);
      note.appendChild(noteText);
      output.appendChild(note);
    }
  }

  function setInputModeForTab() {
    var tabInfo = tabState[currentTab];
    var isInteractive = !tabInfo || tabInfo.type !== "static";

    input.disabled = !isInteractive;
    input.placeholder = isInteractive ? "" : "-";
    form.classList.toggle("is-disabled", !isInteractive);
  }

  function appendPostPrintPrompt(lastPrinted) {
    appendLine("", "terminal-spacer");
    appendLine(
      label(data.printedLabel, "Printed article") +
        " #" +
        String(lastPrinted) +
        ".",
      "terminal-hint",
    );

    var hintRow = document.createElement("div");
    hintRow.className = "terminal-line terminal-hint";

    var intro = document.createElement("span");
    intro.textContent = label(data.nextLabel, "Another number or") + " ";

    var keyButton = document.createElement("button");
    keyButton.type = "button";
    keyButton.className = "terminal-inline-action";
    keyButton.textContent = listKey;
    keyButton.addEventListener("click", function () {
      submitSelection(listKey);
      input.focus();
    });

    var middle = document.createElement("span");
    middle.textContent = " ";

    var textButton = document.createElement("button");
    textButton.type = "button";
    textButton.className = "terminal-inline-action";
    textButton.textContent = label(data.listHintLabel, "print the list");
    textButton.addEventListener("click", function () {
      submitSelection(listKey);
      input.focus();
    });

    hintRow.appendChild(intro);
    hintRow.appendChild(keyButton);
    hintRow.appendChild(middle);
    hintRow.appendChild(textButton);
    output.appendChild(hintRow);
    scrollToBottom();
  }

  function appendMenu() {
    var tabInfo = tabState[currentTab];
    if (!tabInfo) {
      return;
    }

    appendLine("", "terminal-spacer");
    appendLine("[" + tabLabel(currentTab) + "]", "terminal-label");

    if (tabInfo.type === "static") {
      appendContactCard();
      return;
    }

    if (!tabInfo.items.length) {
      appendLine(label(data.emptyLabel, "No entries"), "terminal-error");
      return;
    }

    tabInfo.items.forEach(function (item, idx) {
      var row = document.createElement("div");
      row.className = "terminal-line terminal-option-row";

      var optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "terminal-option";
      optionButton.dataset.choice = String(idx + 1);
      optionButton.textContent = String(idx + 1) + ") " + item.title;

      optionButton.addEventListener("click", function () {
        input.value = optionButton.dataset.choice || "";
        input.focus();
        submitSelection(optionButton.dataset.choice || "");
        input.value = "";
      });

      row.appendChild(optionButton);
      output.appendChild(row);
    });

    if (tabInfo.type === "settings") {
      appendLine(
        label(data.settingsPrompt, "Choose setting number then Enter"),
        "terminal-hint",
      );
    } else {
      appendLine(label(data.promptLabel, "Number then Enter"), "terminal-hint");
      appendLine(
        listKey + " " + label(data.listHintLabel, "print the list"),
        "terminal-hint",
      );
    }

    scrollToBottom();
  }

  function submitSelection(rawValue) {
    var value = String(rawValue || "").trim();
    if (!value) {
      return;
    }

    appendLine("$ " + value, "terminal-entry");

    if (value.toLowerCase() === listKey) {
      appendMenu();
      return;
    }

    var tabInfo = tabState[currentTab];
    if (!tabInfo) {
      return;
    }
    if (tabInfo.type === "static") {
      return;
    }

    var index = Number(value) - 1;
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= tabInfo.items.length
    ) {
      appendLine(label(data.invalidLabel, "Invalid option"), "terminal-error");
      return;
    }

    var selected = tabInfo.items[index];

    if (tabInfo.type === "settings") {
      if (selected.kind === "language" && selected.url) {
        window.location.href = selected.url;
        return;
      }

      if (selected.kind === "theme") {
        applyTheme(selected.theme, true);
        buildSettingsItems();
        switchTab("settings");
        appendLine(
          label(data.settingAppliedLabel, "Setting applied") +
            ": " +
            selected.title,
          "terminal-hint",
        );
        return;
      }

      return;
    }

    appendLine("", "terminal-spacer");
    appendLine("# " + selected.title, "terminal-heading");
    appendBlock(selected.content || "");
    appendPostPrintPrompt(index + 1);
  }

  function switchTab(nextTab) {
    if (!tabState[nextTab]) {
      return;
    }

    currentTab = nextTab;
    output.innerHTML = "";

    var buttons = tabsRoot.querySelectorAll(".terminal-tab");
    buttons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.tab === nextTab);
    });

    appendLine(data.siteTitle || "Terminal", "terminal-banner");
    appendMenu();
    setInputModeForTab();
    input.value = "";
    if (!input.disabled) {
      input.focus();
    }
  }

  tabsRoot.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    var tabButton = target.closest(".terminal-tab");
    if (!tabButton) {
      return;
    }

    switchTab(tabButton.dataset.tab || "microblog");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (input.disabled) {
      return;
    }
    submitSelection(input.value);
    input.value = "";
    input.focus();
  });

  mediaTheme.addEventListener("change", function () {
    if (selectedTheme === "system") {
      applyTheme("system", false);
    }
  });

  loadTheme();
  buildSettingsItems();
  switchTab("microblog");

  if (data.current) {
    var searchOrder = ["microblog", "contacts"];
    for (var i = 0; i < searchOrder.length; i += 1) {
      var tabKey = searchOrder[i];
      var tabInfo = tabState[tabKey];
      if (tabInfo.type === "content") {
        var pageIndex = tabInfo.items.findIndex(function (item) {
          return item.url === data.current;
        });

        if (pageIndex >= 0) {
          switchTab(tabKey);
          submitSelection(String(pageIndex + 1));
          input.value = "";
          break;
        }
      }

      if (tabInfo.type === "static") {
        var tabUrl = tabInfo.card && tabInfo.card.url ? tabInfo.card.url : "";
        if (tabUrl === data.current) {
          switchTab(tabKey);
          break;
        }
      }
    }
  }
})();
