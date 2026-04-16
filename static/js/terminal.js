(function(conf) {
  var terminal = document.querySelector("[data-terminal]");
  if (!terminal) return;

  /* ── DOM refs ── */

  var dom = {
    line: terminal.querySelector("[data-terminal-command-line]"),
    command: terminal.querySelector("[data-terminal-command]"),
    output: terminal.querySelector("[data-terminal-output]"),
    screen: terminal.querySelector(".terminal-screen"),
    skip: terminal.querySelector("[data-terminal-skip]"),
    form: terminal.querySelector("[data-terminal-form]"),
    input: terminal.querySelector("[data-terminal-input]"),
    history: terminal.querySelector("[data-terminal-history]"),
    ghost: terminal.querySelector("[data-terminal-ghost]"),
    caret: terminal.querySelector("[data-terminal-caret]"),
    title: terminal.querySelector("[data-terminal-title]")
  };

  var introCommand = dom.command ? dom.command.dataset.terminalCommand : "";
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Filesystem ── */

  var fsRoot = { children: conf.fs };
  var cwd = [];

  function isDir(node) { return !!(node && node.children); }

  function getNode(segments) {
    var node = fsRoot;
    for (var i = 0; i < segments.length; i++) {
      if (!node.children || !node.children[segments[i]]) return null;
      node = node.children[segments[i]];
    }
    return node;
  }

  function resolvePath(path) {
    if (!path || path === "~") return [];
    if (path === ".") return cwd.slice();
    if (path === "..") { var r = cwd.slice(); r.pop(); return r; }
    var segments;
    if (path.indexOf("~/") === 0) {
      segments = path.slice(2).split("/").filter(Boolean);
    } else if (path.indexOf("/") === 0) {
      var home = conf.home;
      if (path === home || path === home + "/") return [];
      if (path.indexOf(home + "/") === 0) {
        segments = path.slice(home.length + 1).split("/").filter(Boolean);
      } else {
        return null;
      }
    } else {
      segments = cwd.concat(path.split("/").filter(Boolean));
    }
    var resolved = [];
    for (var i = 0; i < segments.length; i++) {
      if (segments[i] === ".") continue;
      if (segments[i] === "..") { if (resolved.length > 0) resolved.pop(); }
      else resolved.push(segments[i]);
    }
    return resolved;
  }

  function cwdString() {
    return "~" + (cwd.length ? "/" + cwd.join("/") : "");
  }

  function promptHost() {
    return conf.user + "@" + conf.hostname + ":" + cwdString();
  }

  function updateTitle() {
    if (dom.title) dom.title.textContent = promptHost();
  }

  /* ── Rendering helpers ── */

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function(ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
    });
  }

  function tag(cls, text) { return '<span class="' + cls + '">' + text + "</span>"; }

  function link(label, href) { return '<a href="' + href + '">' + label + "</a>"; }

  /* ── ls formatting ── */

  function formatLs(node, flags) {
    var names = Object.keys(node.children);
    var entries = [];

    if (flags.a) {
      entries.push({ name: ".", dir: true });
      entries.push({ name: "..", dir: true });
    }

    names.forEach(function(name) {
      var child = node.children[name];
      var dir = isDir(child);
      entries.push({ name: name, dir: dir, node: child, count: dir ? Object.keys(child.children).length : 1 });
    });

    if (!flags.l) {
      return "<p>" + entries.map(function(e) {
        var display = escapeHtml(e.name) + (e.dir ? "/" : "");
        if (e.dir) return tag("ls-dir", display);
        if (e.node && e.node.url) return tag("ls-link", display);
        return display;
      }).join("&emsp;") + "</p>";
    }

    var lines = entries.map(function(e) {
      var perms = e.dir ? "drwxr-xr-x" : "-rw-r--r--";
      var count = (e.name === "." || e.name === "..") ? " " : String(e.count);
      var display = escapeHtml(e.name) + (e.dir ? "/" : "");
      if (e.dir) display = tag("ls-dir", display);
      else if (e.node && e.node.url) display = tag("ls-link", display);
      return tag("ls-perms", perms) + "  " + count.padStart(2) + " " + conf.user + "  " + display;
    });

    return '<div class="ls-long">' + lines.join("\n") + "</div>";
  }

  function parseLsArgs(parts) {
    var flags = { a: false, l: false };
    var path = null;
    for (var i = 1; i < parts.length; i++) {
      if (parts[i].indexOf("-") === 0) {
        var f = parts[i].slice(1);
        for (var j = 0; j < f.length; j++) {
          if (f[j] === "a") flags.a = true;
          if (f[j] === "l") flags.l = true;
        }
      } else {
        path = parts[i];
      }
    }
    return { flags: flags, path: path };
  }

  /* ── Commands ── */

  var commands = {};

  commands.help = function() {
    return [
      "<p>commands: whoami, ls [-al], cd, cat, open, pwd, date, clear</p>",
      "<p>tip: " + tag("strong", "tab") + " to autocomplete, " + tag("strong", "\u2191\u2193") + " for history</p>"
    ].join("");
  };

  commands.whoami = function() {
    return "<p>" + escapeHtml(conf.identity) + "</p>";
  };
  commands.about = commands.whoami;

  commands.clear = function() {
    if (dom.history) dom.history.innerHTML = "";
    return null;
  };

  commands.ls = function(raw, parts) {
    var parsed = parseLsArgs(parts);
    var segments = parsed.path ? resolvePath(parsed.path) : cwd.slice();
    if (segments === null) return "<p>ls: cannot access '" + escapeHtml(parsed.path) + "': No such file or directory</p>";
    var node = getNode(segments);
    if (!node) return "<p>ls: cannot access '" + escapeHtml(parsed.path) + "': No such file or directory</p>";
    if (!isDir(node)) return "<p>" + escapeHtml(parsed.path) + "</p>";
    return formatLs(node, parsed.flags);
  };

  commands.cd = function(raw, parts) {
    var target = parts[1] || "~";
    var newPath = resolvePath(target);
    if (newPath === null) return "<p>cd: " + escapeHtml(target) + ": No such directory</p>";
    var node = getNode(newPath);
    if (!node) return "<p>cd: " + escapeHtml(target) + ": No such directory</p>";
    if (!isDir(node)) return "<p>cd: " + escapeHtml(target) + ": Not a directory</p>";
    cwd = newPath;
    updateTitle();
    return "";
  };

  commands.cat = function(raw, parts) {
    if (!parts[1]) return "<p>usage: cat &lt;file&gt;</p>";
    var path = parts.slice(1).join(" ");
    var segments = resolvePath(path);
    if (segments === null) return "<p>cat: " + escapeHtml(path) + ": No such file</p>";
    var node = getNode(segments);
    if (!node) return "<p>cat: " + escapeHtml(path) + ": No such file</p>";
    if (isDir(node)) return "<p>cat: " + escapeHtml(path) + ": Is a directory</p>";
    var out = "";
    if (node.content) out += "<p>" + escapeHtml(node.content) + "</p>";
    if (node.url) out += "<p>\u2192 " + link(node.url, node.url) + "</p>";
    return out || "<p>(empty)</p>";
  };

  commands.open = function(raw, parts) {
    if (!parts[1]) return "<p>usage: open &lt;file&gt;</p>";
    var path = parts.slice(1).join(" ");
    var segments = resolvePath(path);
    var node = segments !== null ? getNode(segments) : null;

    if (!node && conf.shortcuts[path]) {
      var shortcutSegments = resolvePath(conf.shortcuts[path]);
      if (shortcutSegments) node = getNode(shortcutSegments);
    }

    if (!node) return "<p>open: " + escapeHtml(path) + ": No such file</p>";
    if (isDir(node)) return "<p>open: " + escapeHtml(path) + ": Is a directory. Use cd.</p>";
    if (node.url) {
      window.location.href = node.url;
      return "<p>opening " + escapeHtml(path) + "...</p>";
    }
    return "<p>open: " + escapeHtml(path) + ": No URL associated</p>";
  };

  commands.pwd = function() {
    return "<p>" + conf.home + (cwd.length ? "/" + cwd.join("/") : "") + "</p>";
  };

  commands.date = function() {
    return "<p>" + escapeHtml(new Date().toString()) + "</p>";
  };

  commands.echo = function(raw) {
    return "<p>" + escapeHtml(raw.slice(5)) + "</p>";
  };

  commands.sudo = function() {
    return "<p>nice try.</p>";
  };

  var commandNames = Object.keys(commands);

  function responseFor(rawCommand) {
    var normalized = rawCommand.trim().toLowerCase();
    var parts = normalized.split(/\s+/);
    if (!normalized) return "";
    var handler = commands[parts[0]];
    if (handler) return handler(rawCommand, parts);
    return "<p>command not found: " + escapeHtml(rawCommand) + ". Try " + tag("strong", "help") + ".</p>";
  }

  /* ── Tab completion ── */

  function getCompletion(value) {
    if (!value) return "";
    var tokens = value.split(/\s+/);
    var cmd = tokens[0].toLowerCase();

    if (tokens.length <= 1) {
      var matches = commandNames.filter(function(c) { return c.indexOf(cmd) === 0 && c !== cmd; });
      if (matches.length === 1) {
        var needsArg = ["open", "cat", "cd", "ls", "echo"].indexOf(matches[0]) >= 0;
        return matches[0].slice(cmd.length) + (needsArg ? " " : "");
      }
      return "";
    }

    if (["cd", "ls", "cat", "open"].indexOf(cmd) < 0) return "";

    var lastToken = tokens[tokens.length - 1];
    if (value[value.length - 1] === " ") lastToken = "";
    if (lastToken.indexOf("-") === 0) return "";

    var lastSlash = lastToken.lastIndexOf("/");
    var dirPart, namePart;
    if (lastSlash >= 0) {
      dirPart = lastToken.slice(0, lastSlash) || (lastToken[0] === "~" ? "~" : ".");
      namePart = lastToken.slice(lastSlash + 1);
    } else {
      dirPart = ".";
      namePart = lastToken;
    }

    var dirSegments = resolvePath(dirPart);
    if (dirSegments === null) return "";
    var dirNode = getNode(dirSegments);
    if (!isDir(dirNode)) return "";

    var entries = Object.keys(dirNode.children);
    if (cmd === "cd") entries = entries.filter(function(e) { return isDir(dirNode.children[e]); });

    var lower = namePart.toLowerCase();
    var matches = entries.filter(function(e) { return e.toLowerCase().indexOf(lower) === 0 && e.toLowerCase() !== lower; });

    if (matches.length === 1) {
      var suffix = matches[0].slice(namePart.length);
      if (isDir(dirNode.children[matches[0]])) suffix += "/";
      return suffix;
    }

    if (namePart) {
      var exact = entries.filter(function(e) { return e.toLowerCase() === lower; });
      if (exact.length === 1 && isDir(dirNode.children[exact[0]]) && lastToken[lastToken.length - 1] !== "/") {
        return "/";
      }
    }

    return "";
  }

  /* ── Ghost text & caret ── */

  function updateGhost() {
    if (!dom.ghost || !dom.input) return;
    var completion = getCompletion(dom.input.value);
    dom.ghost.textContent = completion ? dom.input.value + completion : "";
  }

  var measureCtx = null;
  function measureText(text) {
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
    if (dom.input) measureCtx.font = getComputedStyle(dom.input).font;
    return measureCtx.measureText(text).width;
  }

  function updateCaret() {
    if (!dom.caret || !dom.input) return;
    dom.caret.style.left = measureText(dom.input.value.slice(0, dom.input.selectionStart)) + "px";
  }

  function refreshInput() { updateGhost(); updateCaret(); }

  /* ── Intro animation ── */

  function delay(ms) {
    return new Promise(function(resolve) { window.setTimeout(resolve, ms); });
  }

  function showIntro() {
    if (dom.line) { dom.line.hidden = false; dom.line.classList.remove("is-active"); }
    if (dom.command) dom.command.textContent = introCommand;
    if (dom.output) { dom.output.hidden = false; dom.output.classList.add("is-visible"); }
    if (dom.form) dom.form.hidden = false;
    if (dom.skip) dom.skip.hidden = true;
    sessionStorage.setItem("terminalSeen", Date.now().toString());
    window.setTimeout(function() {
      if (dom.screen) dom.screen.scrollTop = dom.screen.scrollHeight;
      if (dom.input) dom.input.focus();
    }, 0);
  }

  async function runIntro() {
    if (!dom.line || !dom.command || !dom.output) { showIntro(); return; }
    dom.command.textContent = "";
    dom.output.hidden = true;
    if (dom.form) dom.form.hidden = true;
    if (dom.skip) dom.skip.hidden = false;
    await delay(520);
    dom.line.classList.add("is-active");
    for (var i = 0; i <= introCommand.length; i++) {
      if (cancelled) return;
      dom.command.textContent = introCommand.slice(0, i);
      await delay(46 + Math.random() * 28);
    }
    if (cancelled) return;
    await delay(170);
    showIntro();
  }

  /* ── History ── */

  var inputHistory = [];
  var historyIndex = -1;
  var cancelled = false;

  function appendHistory(rawCommand, response) {
    if (!dom.history) return;
    var entry = document.createElement("div");
    entry.className = "terminal-history-entry";
    var cmdLine = document.createElement("div");
    cmdLine.className = "terminal-history-command";
    cmdLine.innerHTML = tag("terminal-prompt", "$") + "<span>" + escapeHtml(rawCommand) + "</span>";
    entry.appendChild(cmdLine);
    if (response) {
      var resp = document.createElement("div");
      resp.className = "terminal-response";
      resp.innerHTML = response;
      entry.appendChild(resp);
    }
    dom.history.appendChild(entry);
    if (dom.screen) dom.screen.scrollTop = dom.screen.scrollHeight;
  }

  /* ── Event wiring ── */

  if (dom.skip) {
    dom.skip.addEventListener("click", function() { cancelled = true; showIntro(); });
  }

  if (dom.form && dom.input) {
    dom.form.addEventListener("submit", function(event) {
      event.preventDefault();
      var raw = dom.input.value;
      dom.input.value = "";
      refreshInput();
      if (raw.trim()) {
        inputHistory.push(raw);
        historyIndex = inputHistory.length;
      }
      var response = responseFor(raw);
      if (response !== null) appendHistory(raw, response);
    });

    dom.input.addEventListener("keydown", function(event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!inputHistory.length) return;
        if (historyIndex > 0) historyIndex--;
        dom.input.value = inputHistory[historyIndex] || "";
        refreshInput();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (historyIndex < inputHistory.length - 1) {
          historyIndex++;
          dom.input.value = inputHistory[historyIndex];
        } else {
          historyIndex = inputHistory.length;
          dom.input.value = "";
        }
        refreshInput();
      } else if (event.key === "Tab") {
        var completion = getCompletion(dom.input.value);
        if (completion) {
          event.preventDefault();
          dom.input.value += completion;
          refreshInput();
        }
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
        setTimeout(updateCaret, 0);
      }
    });

    dom.input.addEventListener("input", refreshInput);
  }

  terminal.addEventListener("click", function(event) {
    if (event.target instanceof HTMLAnchorElement || event.target instanceof HTMLButtonElement) return;
    if (dom.input) dom.input.focus();
  });

  window.addEventListener("pageshow", function() {
    if (dom.input) dom.input.focus();
  });

  /* ── Theme switcher ── */

  function setTheme(name) {
    if (name === "default") terminal.removeAttribute("data-theme");
    else terminal.setAttribute("data-theme", name);
    var btns = document.querySelectorAll("[data-theme-btn]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("is-active", btns[i].dataset.themeBtn === name);
    }
  }

  var switcher = document.createElement("div");
  switcher.className = "theme-switcher";
  conf.themes.forEach(function(name) {
    var btn = document.createElement("button");
    btn.textContent = conf.themeLabels[name] || name;
    btn.dataset.themeBtn = name;
    if (name === conf.theme) btn.classList.add("is-active");
    btn.addEventListener("click", function() { setTheme(name); });
    switcher.appendChild(btn);
  });
  document.body.appendChild(switcher);
  setTheme(conf.theme);

  /* ── Init ── */

  var lastSeen = Number(sessionStorage.getItem("terminalSeen") || 0);
  if (prefersReducedMotion || (lastSeen && Date.now() - lastSeen < conf.intro.staleAfter)) {
    showIntro();
  } else {
    runIntro();
  }
})(SITE);
