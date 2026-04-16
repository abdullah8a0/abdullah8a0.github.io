(function() {
  const terminal = document.querySelector("[data-terminal]");
  if (!terminal) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const line = terminal.querySelector("[data-terminal-command-line]");
  const commandEl = terminal.querySelector("[data-terminal-command]");
  const outputEl = terminal.querySelector("[data-terminal-output]");
  const screenEl = terminal.querySelector(".terminal-screen");
  const skipButton = terminal.querySelector("[data-terminal-skip]");
  const form = terminal.querySelector("[data-terminal-form]");
  const input = terminal.querySelector("[data-terminal-input]");
  const historyEl = terminal.querySelector("[data-terminal-history]");
  const ghostEl = terminal.querySelector("[data-terminal-ghost]");
  const caretEl = terminal.querySelector("[data-terminal-caret]");
  const titleEl = terminal.querySelector("[data-terminal-title]");
  const command = commandEl ? commandEl.dataset.terminalCommand : "";
  let cancelled = false;
  let commandHistory = [];
  let historyIndex = -1;

  /* ── Virtual filesystem ── */

  var fsRoot = {
    children: {
      "resume.pdf": { url: "/assets/Resume.pdf", content: "Resume \u2014 Abdullah (PDF)" },
      "projects": {
        children: {
          "u2f-security-key": { url: "https://github.com/itstorque/u2f", content: "FIDO U2F hardware security key." },
          "onechan": { url: "https://github.com/abdullah8a0/one-chan", content: "FPGA chess engine with a custom accelerator." },
          "profemon": { url: "https://github.com/abdullah8a0/profemon", content: "ESP32 in-person PvP game system." }
        }
      },
      "links": {
        children: {
          "email": { url: "mailto:abdullah8a0@gmail.com", content: "abdullah8a0@gmail.com" },
          "github": { url: "https://github.com/abdullah8a0/", content: "https://github.com/abdullah8a0/" },
          "linkedin": { url: "https://www.linkedin.com/in/abdula1/", content: "https://www.linkedin.com/in/abdula1/" }
        }
      }
    }
  };

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
      if (path === "/home/abdullah" || path === "/home/abdullah/") return [];
      if (path.indexOf("/home/abdullah/") === 0) {
        segments = path.slice("/home/abdullah/".length).split("/").filter(Boolean);
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

  function updateTitle() {
    if (titleEl) titleEl.textContent = "abdullah@itsabdullah.dev:" + cwdString();
  }

  /* ── Well-known shortcuts for open ── */

  var shortcuts = {
    resume: ["resume.pdf"],
    email: ["links", "email"],
    github: ["links", "github"],
    linkedin: ["links", "linkedin"],
  };

  /* ── Tab completion ── */

  var allCommands = ["help", "whoami", "open", "clear", "ls", "cat", "pwd", "date", "cd"];

  function getCompletion(value) {
    if (!value) return "";
    var tokens = value.split(/\s+/);
    var cmd = tokens[0].toLowerCase();

    if (tokens.length <= 1) {
      var matches = allCommands.filter(function(c) { return c.indexOf(cmd) === 0 && c !== cmd; });
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
    if (cmd === "cd") {
      entries = entries.filter(function(e) { return isDir(dirNode.children[e]); });
    }

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

  function updateGhost() {
    if (!ghostEl || !input) return;
    var value = input.value;
    var completion = getCompletion(value);
    if (completion) {
      ghostEl.textContent = value + completion;
    } else {
      ghostEl.textContent = "";
    }
  }

  var measureCtx = null;
  function measureText(text) {
    if (!measureCtx) {
      var canvas = document.createElement("canvas");
      measureCtx = canvas.getContext("2d");
    }
    if (input) measureCtx.font = getComputedStyle(input).font;
    return measureCtx.measureText(text).width;
  }

  function updateCaret() {
    if (!caretEl || !input) return;
    var before = input.value.slice(0, input.selectionStart);
    caretEl.style.left = measureText(before) + "px";
  }

  /* ── Utilities ── */

  function delay(ms) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function showIntro() {
    if (line) {
      line.hidden = false;
      line.classList.remove("is-active");
    }
    if (commandEl) commandEl.textContent = command;
    if (outputEl) {
      outputEl.hidden = false;
      outputEl.classList.add("is-visible");
    }
    if (form) form.hidden = false;
    if (skipButton) skipButton.hidden = true;
    sessionStorage.setItem("terminalSeen", Date.now().toString());
    window.setTimeout(function() {
      scrollTerminalToBottom();
      if (input) input.focus();
    }, 0);
  }

  function scrollTerminalToBottom() {
    if (!screenEl) return;
    screenEl.scrollTop = screenEl.scrollHeight;
  }

  async function runIntro() {
    if (!line || !commandEl || !outputEl) {
      showIntro();
      return;
    }
    commandEl.textContent = "";
    outputEl.hidden = true;
    if (form) form.hidden = true;
    if (skipButton) skipButton.hidden = false;
    await delay(520);
    line.classList.add("is-active");
    for (let i = 0; i <= command.length; i++) {
      if (cancelled) return;
      commandEl.textContent = command.slice(0, i);
      await delay(46 + Math.random() * 28);
    }
    if (cancelled) return;
    await delay(170);
    showIntro();
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function(char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
    });
  }

  function link(label, href) {
    return '<a href="' + href + '">' + label + "</a>";
  }

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
      entries.push({
        name: name,
        dir: dir,
        node: child,
        count: dir ? Object.keys(child.children).length : 1
      });
    });

    if (!flags.l) {
      return "<p>" + entries.map(function(e) {
        var display = escapeHtml(e.name) + (e.dir ? "/" : "");
        if (e.dir) return '<span style="color:var(--green)">' + display + "</span>";
        if (e.node && e.node.url) return '<span style="color:var(--cyan)">' + display + "</span>";
        return display;
      }).join("&emsp;") + "</p>";
    }

    var lines = entries.map(function(e) {
      var perms = e.dir ? "drwxr-xr-x" : "-rw-r--r--";
      var count = (e.name === "." || e.name === "..") ? " " : String(e.count);
      var display = escapeHtml(e.name) + (e.dir ? "/" : "");
      if (e.dir) display = '<span style="color:var(--green)">' + display + "</span>";
      else if (e.node && e.node.url) display = '<span style="color:var(--cyan)">' + display + "</span>";
      return '<span style="color:var(--muted)">' + perms + "</span>  " + count.padStart(2) + " abdullah  " + display;
    });

    return '<div style="white-space:pre;line-height:1.8">' + lines.join("\n") + "</div>";
  }

  /* ── Command handling ── */

  function responseFor(rawCommand) {
    const normalized = rawCommand.trim().toLowerCase();
    const parts = normalized.split(/\s+/);

    if (!normalized) return "";

    if (normalized === "help") {
      return [
        "<p>commands: whoami, ls [-al], cd, cat, open, pwd, date, clear</p>",
        "<p>tip: <strong>tab</strong> to autocomplete, <strong>\u2191\u2193</strong> for history</p>"
      ].join("");
    }

    if (normalized === "whoami" || normalized === "about") {
      return "<p>Abdullah. MIT CS + Math graduate. R&D engineer at Siemens EDA working on solver performance and design verification.</p>";
    }

    if (normalized === "clear") {
      if (historyEl) historyEl.innerHTML = "";
      return null;
    }

    /* ls */
    if (parts[0] === "ls") {
      var lsArgs = parts.slice(1);
      var flags = { a: false, l: false };
      var lsPath = null;
      for (var i = 0; i < lsArgs.length; i++) {
        if (lsArgs[i].indexOf("-") === 0) {
          var f = lsArgs[i].slice(1);
          for (var j = 0; j < f.length; j++) {
            if (f[j] === "a") flags.a = true;
            if (f[j] === "l") flags.l = true;
          }
        } else {
          lsPath = lsArgs[i];
        }
      }
      var lsSegments = lsPath ? resolvePath(lsPath) : cwd.slice();
      if (lsSegments === null) return "<p>ls: cannot access '" + escapeHtml(lsPath) + "': No such file or directory</p>";
      var lsNode = getNode(lsSegments);
      if (!lsNode) return "<p>ls: cannot access '" + escapeHtml(lsPath) + "': No such file or directory</p>";
      if (!isDir(lsNode)) return "<p>" + escapeHtml(lsPath) + "</p>";
      return formatLs(lsNode, flags);
    }

    /* cd */
    if (parts[0] === "cd") {
      var cdTarget = parts[1] || "~";
      var newPath = resolvePath(cdTarget);
      if (newPath === null) return "<p>cd: " + escapeHtml(cdTarget) + ": No such directory</p>";
      var cdNode = getNode(newPath);
      if (!cdNode) return "<p>cd: " + escapeHtml(cdTarget) + ": No such directory</p>";
      if (!isDir(cdNode)) return "<p>cd: " + escapeHtml(cdTarget) + ": Not a directory</p>";
      cwd = newPath;
      updateTitle();
      return "";
    }

    /* cat */
    if (parts[0] === "cat") {
      if (!parts[1]) return "<p>usage: cat &lt;file&gt;</p>";
      var catPath = parts.slice(1).join(" ");
      var catSegments = resolvePath(catPath);
      if (catSegments === null) return "<p>cat: " + escapeHtml(catPath) + ": No such file</p>";
      var catNode = getNode(catSegments);
      if (!catNode) return "<p>cat: " + escapeHtml(catPath) + ": No such file</p>";
      if (isDir(catNode)) return "<p>cat: " + escapeHtml(catPath) + ": Is a directory</p>";
      var out = "";
      if (catNode.content) out += "<p>" + escapeHtml(catNode.content) + "</p>";
      if (catNode.url) out += "<p>\u2192 " + link(catNode.url, catNode.url) + "</p>";
      return out || "<p>(empty)</p>";
    }

    /* open */
    if (parts[0] === "open") {
      if (!parts[1]) return "<p>usage: open &lt;file&gt;</p>";
      var openPath = parts.slice(1).join(" ");
      var openSegments = resolvePath(openPath);
      var openNode = openSegments !== null ? getNode(openSegments) : null;

      if (!openNode && shortcuts[openPath]) {
        openNode = getNode(shortcuts[openPath]);
      }

      if (!openNode) return "<p>open: " + escapeHtml(openPath) + ": No such file</p>";
      if (isDir(openNode)) return "<p>open: " + escapeHtml(openPath) + ": Is a directory. Use cd.</p>";
      if (openNode.url) {
        window.location.href = openNode.url;
        return "<p>opening " + escapeHtml(openPath) + "...</p>";
      }
      return "<p>open: " + escapeHtml(openPath) + ": No URL associated</p>";
    }

    if (normalized === "pwd") {
      return "<p>/home/abdullah" + (cwd.length ? "/" + cwd.join("/") : "") + "</p>";
    }

    if (normalized === "date") {
      return "<p>" + escapeHtml(new Date().toString()) + "</p>";
    }

    if (parts[0] === "echo") {
      return "<p>" + escapeHtml(rawCommand.slice(5)) + "</p>";
    }

    if (parts[0] === "sudo") {
      return "<p>nice try.</p>";
    }

    return "<p>command not found: " + escapeHtml(rawCommand) + ". Try <strong>help</strong>.</p>";
  }

  /* ── History & DOM ── */

  function appendHistory(rawCommand, response) {
    if (!historyEl) return;

    const entry = document.createElement("div");
    entry.className = "terminal-history-entry";

    const commandLine = document.createElement("div");
    commandLine.className = "terminal-history-command";
    commandLine.innerHTML = '<span class="terminal-prompt">$</span><span>' + escapeHtml(rawCommand) + "</span>";
    entry.appendChild(commandLine);

    if (response) {
      const responseEl = document.createElement("div");
      responseEl.className = "terminal-response";
      responseEl.innerHTML = response;
      entry.appendChild(responseEl);
    }

    historyEl.appendChild(entry);
    scrollTerminalToBottom();
  }

  /* ── Event wiring ── */

  if (skipButton) {
    skipButton.addEventListener("click", function() {
      cancelled = true;
      showIntro();
    });
  }

  if (form && input) {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      const rawCommand = input.value;
      input.value = "";
      updateGhost();
      updateCaret();
      if (rawCommand.trim()) {
        commandHistory.push(rawCommand);
        historyIndex = commandHistory.length;
      }
      const response = responseFor(rawCommand);
      if (response !== null) appendHistory(rawCommand, response);
    });

    input.addEventListener("keydown", function(event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (commandHistory.length === 0) return;
        if (historyIndex > 0) historyIndex--;
        input.value = commandHistory[historyIndex] || "";
        updateGhost();
        updateCaret();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          input.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          input.value = "";
        }
        updateGhost();
        updateCaret();
      } else if (event.key === "Tab") {
        var completion = getCompletion(input.value);
        if (completion) {
          event.preventDefault();
          input.value = input.value + completion;
          updateGhost();
          updateCaret();
        }
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
        setTimeout(updateCaret, 0);
      }
    });

    input.addEventListener("input", function() {
      updateGhost();
      updateCaret();
    });
  }

  terminal.addEventListener("click", function(event) {
    if (event.target instanceof HTMLAnchorElement || event.target instanceof HTMLButtonElement) return;
    if (input) input.focus();
  });

  window.addEventListener("pageshow", function() {
    if (input) input.focus();
  });

  /* ── Theme switcher ── */

  var themeNames = ["default", "tty", "crt", "brutalist", "float"];
  var themeLabels = { default: "macOS", tty: "TTY", crt: "CRT", brutalist: "Brutal", float: "Float" };

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
  themeNames.forEach(function(name) {
    var btn = document.createElement("button");
    btn.textContent = themeLabels[name];
    btn.dataset.themeBtn = name;
    if (name === "brutalist") btn.classList.add("is-active");
    btn.addEventListener("click", function() { setTheme(name); });
    switcher.appendChild(btn);
  });
  document.body.appendChild(switcher);
  setTheme("brutalist");

  var lastSeen = Number(sessionStorage.getItem("terminalSeen") || 0);
  var staleAfter = 1000; // 1s for testing, use 3600000 for 1 hour
  if (prefersReducedMotion || (lastSeen && Date.now() - lastSeen < staleAfter)) {
    showIntro();
  } else {
    runIntro();
  }
})();
