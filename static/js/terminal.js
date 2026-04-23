(function(conf) {
  var terminal = document.querySelector("[data-terminal]");
  if (!terminal) return;

  /* ── DOM refs ── */

  var dom = {
    line: terminal.querySelector("[data-terminal-command-line]"),
    command: terminal.querySelector("[data-terminal-command]"),
    output: terminal.querySelector("[data-terminal-output]"),
    screen: terminal.querySelector(".terminal-screen"),
    form: terminal.querySelector("[data-terminal-form]"),
    input: terminal.querySelector("[data-terminal-input]"),
    history: terminal.querySelector("[data-terminal-history]"),
    ghost: terminal.querySelector("[data-terminal-ghost]"),
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
      "<p>commands: whoami, ls, cd, cat, open, pwd, date, echo, clear,</p>",
      "<p>          theme, neofetch, tree, history, grep, man, viz, motd</p>",
      "<p>tip: " + tag("strong", "tab") + " to autocomplete, " + tag("strong", "\u2191\u2193") + " for history, " + tag("strong", "man &lt;cmd&gt;") + " for details</p>"
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
    if (!parts[1]) return "<p>meow.</p>";
    var path = parts.slice(1).join(" ");
    var segments = resolvePath(path);
    if (segments === null) return "<p>cat: " + escapeHtml(path) + ": No such file</p>";
    var node = getNode(segments);
    if (!node) return "<p>cat: " + escapeHtml(path) + ": No such file</p>";
    if (isDir(node)) return "<p>cat: " + escapeHtml(path) + ": Is a directory</p>";
    var out = "";
    if (node.content) {
      if (node.url) out += "<p>" + link(escapeHtml(node.content), node.url) + "</p>";
      else out += "<p>" + escapeHtml(node.content) + "</p>";
    }
    if (node.url) out += "<p>\u2192 " + link(escapeHtml(node.url), node.url) + "</p>";
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

  /* ── theme command ── */

  commands.theme = function(raw, parts) {
    var name = parts[1];
    if (!name) {
      var current = terminal.getAttribute("data-theme") || "default";
      return "<p>current: " + escapeHtml(current) + "</p>" +
        "<p>available: " + conf.themes.join(", ") + "</p>";
    }
    if (conf.themes.indexOf(name) < 0) {
      return "<p>theme: '" + escapeHtml(name) + "' not found. available: " + conf.themes.join(", ") + "</p>";
    }
    if (name === "default") {
      terminal.removeAttribute("data-theme");
    } else {
      terminal.setAttribute("data-theme", name);
    }
    try { localStorage.setItem("terminal-theme", name); } catch(e) {}
    return "<p>switched to " + escapeHtml(name) + "</p>";
  };

  /* ── neofetch command ── */

  commands.neofetch = function() {
    var current = terminal.getAttribute("data-theme") || "default";
    var art = [
      "   ___  _                  _       _   ",
      "  / __)(_)_  _ ____   ___ (_)____ | |_ ",
      " | (__  _ \\ \\/ |  _ \\ / _ \\| |  _ \\| __|",
      " | |   | | )  (| |_) | (_) | | | | | |_ ",
      " |_|   |_|/ /\\_\\  __/ \\___/|_|_| |_|\\__|",
      "              |_|                        "
    ];
    var info = [
      tag("strong", conf.user) + "@" + tag("strong", conf.hostname),
      "──────────────────",
      tag("neofetch-label", "OS") + ": fixpoint.cc",
      tag("neofetch-label", "Kernel") + ": Hugo",
      tag("neofetch-label", "Shell") + ": terminal.js",
      tag("neofetch-label", "Theme") + ": " + current,
      tag("neofetch-label", "Terminal") + ": " + conf.hostname,
      tag("neofetch-label", "Uptime") + ": " + Math.floor((Date.now() - performance.timeOrigin) / 1000) + "s"
    ];
    var lines = [];
    var max = Math.max(art.length, info.length);
    for (var i = 0; i < max; i++) {
      var left = (i < art.length ? art[i] : "").padEnd(42);
      var right = i < info.length ? info[i] : "";
      lines.push(tag("neofetch-art", escapeHtml(left)) + "  " + right);
    }
    return '<div class="ls-long">' + lines.join("\n") + "</div>";
  };

  /* ── tree command ── */

  function buildTree(node, prefix, isLast) {
    var lines = [];
    var names = Object.keys(node.children);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var child = node.children[name];
      var last = i === names.length - 1;
      var connector = last ? "└── " : "├── ";
      var display = escapeHtml(name);
      if (isDir(child)) display = tag("ls-dir", display + "/");
      else if (child.url) display = tag("ls-link", display);
      lines.push(prefix + connector + display);
      if (isDir(child)) {
        var childPrefix = prefix + (last ? "    " : "│   ");
        lines = lines.concat(buildTree(child, childPrefix, last));
      }
    }
    return lines;
  }

  commands.tree = function(raw, parts) {
    var target = parts[1] || ".";
    var segments = resolvePath(target);
    if (segments === null) return "<p>tree: '" + escapeHtml(target) + "': No such directory</p>";
    var node = getNode(segments);
    if (!node || !isDir(node)) return "<p>tree: '" + escapeHtml(target) + "': Not a directory</p>";
    var header = escapeHtml(target === "." ? cwdString() : target);
    var treeLines = buildTree(node, "", false);
    return '<div class="ls-long">' + tag("ls-dir", header) + "\n" + treeLines.join("\n") + "</div>";
  };

  /* ── history command ── */

  commands.history = function() {
    if (!inputHistory.length) return "<p>no history</p>";
    var lines = inputHistory.map(function(cmd, i) {
      return "  " + String(i + 1).padStart(4) + "  " + escapeHtml(cmd);
    });
    return '<div class="ls-long">' + lines.join("\n") + "</div>";
  };

  /* ── grep command ── */

  function grepFs(node, path, pattern, results) {
    var names = Object.keys(node.children);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var child = node.children[name];
      var fullPath = path ? path + "/" + name : name;
      if (isDir(child)) {
        grepFs(child, fullPath, pattern, results);
      } else if (child.content && child.content.toLowerCase().indexOf(pattern) >= 0) {
        results.push({ path: fullPath, content: child.content });
      }
    }
  }

  commands.grep = function(raw, parts) {
    if (!parts[1]) return "<p>usage: grep &lt;pattern&gt;</p>";
    var pattern = parts[1].toLowerCase();
    var results = [];
    grepFs(fsRoot, "", pattern, results);
    if (!results.length) return "<p>no matches</p>";
    var lines = results.map(function(r) {
      return tag("ls-dir", escapeHtml(r.path)) + ": " + escapeHtml(r.content);
    });
    return "<div>" + lines.map(function(l) { return "<p>" + l + "</p>"; }).join("") + "</div>";
  };

  /* ── man command ── */

  var manPages = {
    help:    { synopsis: "help", desc: "List available commands and keyboard shortcuts." },
    whoami:  { synopsis: "whoami", desc: "Display identity and background information." },
    about:   { synopsis: "about", desc: "Alias for whoami." },
    ls:      { synopsis: "ls [-a] [-l] [path]", desc: "List directory contents. -a shows hidden entries (. and ..), -l shows long format with permissions." },
    cd:      { synopsis: "cd [path]", desc: "Change working directory. Supports ~, .., and relative/absolute paths." },
    cat:     { synopsis: "cat <file>", desc: "Display file contents and associated URL." },
    open:    { synopsis: "open <file>", desc: "Open a file's URL in the browser. Also accepts shortcut names (resume, email, github, linkedin)." },
    pwd:     { synopsis: "pwd", desc: "Print the current working directory." },
    date:    { synopsis: "date", desc: "Display the current date and time." },
    echo:    { synopsis: "echo <text>", desc: "Print text to the terminal." },
    clear:   { synopsis: "clear", desc: "Clear the command history." },
    theme:   { synopsis: "theme [name]", desc: "Switch terminal theme. Without arguments, shows current theme and available options." },
    neofetch:{ synopsis: "neofetch", desc: "Display system information with ASCII art." },
    tree:    { synopsis: "tree [path]", desc: "Display the filesystem as an indented tree." },
    history: { synopsis: "history", desc: "Show previously entered commands." },
    grep:    { synopsis: "grep <pattern>", desc: "Search all files in the filesystem for a text pattern." },
    man:     { synopsis: "man <command>", desc: "Show the manual page for a command." },
    viz:     { synopsis: "viz", desc: "Launch the AIG CDCL visualizer — interactive non-clausal SAT solving on And-Inverter Graphs." },
    motd:    { synopsis: "motd", desc: "Print the message of the day." },
    qotd:    { synopsis: "qotd", desc: "Alias for motd." }
  };

  commands.man = function(raw, parts) {
    if (!parts[1]) return "<p>usage: man &lt;command&gt;</p>";
    var page = manPages[parts[1]];
    if (!page) return "<p>No manual entry for " + escapeHtml(parts[1]) + "</p>";
    return '<div class="ls-long">' +
      tag("strong", escapeHtml(parts[1].toUpperCase())) + "\n\n" +
      tag("neofetch-label", "SYNOPSIS") + "\n    " + escapeHtml(page.synopsis) + "\n\n" +
      tag("neofetch-label", "DESCRIPTION") + "\n    " + escapeHtml(page.desc) +
      "</div>";
  };

  commands.viz = function() {
    window.location.href = "/viz/brutalist.html";
    return "<p>launching visualizer...</p>";
  };

  /* ── motd / qotd ── */

  commands.motd = function() {
    var quote = "In every discourse, whether of the mind conversing with its own thoughts, or of the individual in his folley with others, there is an assumed or expressed limit within which the subjects of its operation are confined. The most unfettered discourse is that in which the words we use are understood in the widest possible application, and for them the limits of discourse are co-extensive with those of the universe itself. But more usually we confine ourselves to a less spacious field. Sometimes, in discoursing of men we imply (without expressing the limitation) that it is of men only under certain circumstances and conditions that we speak, as of civilized men, or of men in the vigour of life, or of men under some other condition or relation. Now, whatever may be the extent of the field within which all the objects of our discourse are found, that field may properly be termed the universe of discourse. Furthermore, this universe of discourse is in the strictest sense the ultimate subject of the discourse.";
    var attribution = "— George Boole, The Laws of Thought. 1854/2003. page 42";
    return "<p>" + escapeHtml(quote) + "</p>" +
      "<p>" + tag("neofetch-label", escapeHtml(attribution)) + "</p>";
  };
  commands.qotd = commands.motd;

  /* ── Easter eggs ── */

  commands["rm"] = function(raw) {
    if (raw.indexOf("-rf") >= 0) return "<p>nice try.</p>";
    return "<p>rm: insufficient permissions</p>";
  };

  commands.vim = function() {
    return "<p>consider trying emacs.</p>";
  };

  commands.emacs = function() {
    return "<p>consider trying vim.</p>";
  };

  commands.exit = function() {
    terminal.style.transition = "opacity 0.5s ease-out";
    terminal.style.opacity = "0";
    setTimeout(function() {
      terminal.innerHTML = '<div style="display:grid;height:100%;place-items:center;opacity:0;animation:links-in 0.5s ease-out forwards;"><p style="color:var(--muted);font-family:var(--mono);">connection closed.</p></div>';
      terminal.style.opacity = "1";
    }, 600);
    return null;
  };

  var commandNames = Object.keys(commands);

  function responseFor(rawCommand) {
    var normalized = rawCommand.trim().toLowerCase();
    var parts = normalized.split(/\s+/);
    if (!normalized) return "";
    var handler = commands[parts[0]];
    if (handler) {
      confusionCount = 0;
      return handler(rawCommand, parts);
    }
    confusionCount++;
    if (confusionCount >= 2) revealLinks();
    var msg = "<p>command not found: " + escapeHtml(rawCommand) + ". Try " + tag("strong", "help") + ".</p>";
    if (confusionCount >= 2 && !isTouch) {
      msg += "<p>hint: scroll up for clickable links.</p>";
    }
    return msg;
  }

  /* ── Tab completion ── */

  function getCompletion(value) {
    if (!value) return "";
    var tokens = value.split(/\s+/);
    var cmd = tokens[0].toLowerCase();

    if (tokens.length <= 1) {
      var matches = commandNames.filter(function(c) { return c.indexOf(cmd) === 0 && c !== cmd; });
      if (matches.length === 1) {
        var needsArg = ["open", "cat", "cd", "ls", "echo", "theme", "tree", "grep", "man"].indexOf(matches[0]) >= 0;
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

  function refreshInput() { updateGhost(); }

  /* ── Intro animation ── */

  function delay(ms) {
    return new Promise(function(resolve) { window.setTimeout(resolve, ms); });
  }

  function showIntro() {
    if (dom.line) { dom.line.hidden = false; dom.line.classList.remove("is-active"); }
    if (dom.command) dom.command.textContent = introCommand;
    if (dom.output) { dom.output.hidden = false; dom.output.classList.add("is-visible"); }
    if (dom.form) dom.form.hidden = false;
    sessionStorage.setItem("terminalSeen", Date.now().toString());
    startIdleTimer();
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

  /* ── Progressive disclosure ── */

  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  var linksRevealed = isTouch;
  var confusionCount = 0;
  var clickCount = 0;
  var hasTyped = false;
  var idleTimer = null;

  function revealLinks() {
    if (linksRevealed) return;
    linksRevealed = true;
    if (idleTimer) clearTimeout(idleTimer);
    var groups = terminal.querySelectorAll("[data-terminal-links]");
    for (var i = 0; i < groups.length; i++) {
      groups[i].classList.add("is-revealed");
    }
  }

  function startIdleTimer() {
    if (linksRevealed) return;
    idleTimer = setTimeout(revealLinks, 10000);
  }

  function resetIdleTimer() {
    if (linksRevealed) return;
    if (idleTimer) clearTimeout(idleTimer);
    startIdleTimer();
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
      resetIdleTimer();
    });

    dom.input.addEventListener("keydown", function(event) {
      resetIdleTimer();
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
      }
    });

    dom.input.addEventListener("input", function() {
      hasTyped = true;
      refreshInput();
    });
  }

  terminal.addEventListener("click", function(event) {
    if (event.target instanceof HTMLAnchorElement || event.target instanceof HTMLButtonElement) return;
    if (!hasTyped) {
      clickCount++;
      if (clickCount >= 2) revealLinks();
    }
    if (dom.input) dom.input.focus();
  });

  window.addEventListener("pageshow", function() {
    if (dom.input) dom.input.focus();
  });

  /* ── Theme ── */

  var savedTheme;
  try { savedTheme = localStorage.getItem("terminal-theme"); } catch(e) {}
  var activeTheme = savedTheme || conf.theme;
  if (activeTheme && activeTheme !== "default") {
    terminal.setAttribute("data-theme", activeTheme);
  }

  /* ── Init ── */

  var navEntry = performance.getEntriesByType("navigation")[0];
  var isReload = navEntry && navEntry.type === "reload";
  var lastSeen = Number(sessionStorage.getItem("terminalSeen") || 0);
  var skipIntro = !isReload && lastSeen && Date.now() - lastSeen < conf.intro.staleAfter;
  if (prefersReducedMotion || skipIntro) {
    showIntro();
  } else {
    runIntro();
  }
})(SITE);
