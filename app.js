(() => {
  'use strict';

  const desktop = document.getElementById('desktop');
  const bootScreen = document.getElementById('bootScreen');
  const bootOutput = document.getElementById('bootOutput');
  const bootProgress = document.getElementById('bootProgress');
  const skipBoot = document.getElementById('skipBoot');
  const startButton = document.getElementById('startButton');
  const startMenu = document.getElementById('startMenu');
  const topClock = document.getElementById('topClock');
  const taskClock = document.getElementById('taskClock');
  const terminalInput = document.getElementById('terminalInput');
  const terminalForm = document.getElementById('terminalForm');
  const terminalOutput = document.getElementById('terminalOutput');
  const scanlines = document.getElementById('scanlines');
  const toggleScanlines = document.getElementById('toggleScanlines');
  const toggleRain = document.getElementById('toggleRain');
  const toggleCursor = document.getElementById('toggleCursor');
  const statusMessage = document.getElementById('statusMessage');
  const canvas = document.getElementById('binaryCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const windows = [...document.querySelectorAll('[data-window]')];
  const openButtons = [...document.querySelectorAll('[data-open]')];
  const taskPrograms = [...document.querySelectorAll('.task-program')];
  let bootTick = 0;
  let bootInterval = null;
  let booted = false;
  let zIndex = 10;
  let rainEnabled = !reducedMotion.matches;
  let raf = 0;
  let columns = [];
  let rainWidth = 0;
  let rainHeight = 0;
  let lastFrame = 0;

  document.getElementById('copyrightYear').textContent = String(new Date().getFullYear());
  toggleRain.checked = rainEnabled;
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  toggleCursor.checked = desktopPointer.matches;
  function updateCursorPreferences() {
    document.body.classList.toggle('deill-cursor-enabled',
      toggleCursor.checked && desktopPointer.matches);
  }
  toggleCursor.addEventListener('change', updateCursorPreferences);
  desktopPointer.addEventListener?.('change', updateCursorPreferences);
  updateCursorPreferences();
  const chileClockFormat = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    timeZone: 'America/Santiago'
  });
  const viewerClockFormat = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  function updateClock() {
    const now = new Date();
    topClock.textContent = chileClockFormat.format(now);
    taskClock.textContent = viewerClockFormat.format(now);
  }
  updateClock();
  window.setInterval(updateClock, 1000);
  const personalVisits = document.getElementById('personalVisits');
  if (personalVisits) {
    const countKey = 'deill_os_browser_sessions_v1';
    try {
      const saved = Number.parseInt(localStorage.getItem(countKey) || '0', 10);
      const previous = Number.isSafeInteger(saved) && saved >= 0 ? saved : 0;
      const count = Math.min(previous + 1, 999999);
      localStorage.setItem(countKey, String(count));
      personalVisits.textContent = new Intl.NumberFormat('es-CL').format(count);
    } catch (_) {
      personalVisits.textContent = '-';
      personalVisits.title = 'No se pudo guardar el contador de cargas en este navegador';
    }
  }

  const bootMessages = [
    'INITIALIZING DEILL_OS...',
    'MOUNTING PROFILE.DAT...',
    'STARTING VISUAL SYSTEMS...',
    'ESTABLISHING LOCAL INTERFACE...',
    'ACCESS GRANTED.'
  ];

  function finishBoot() {
    if (booted) return;
    booted = true;
    if (bootInterval !== null) window.clearInterval(bootInterval);
    bootProgress.style.width = '100%';
    bootOutput.textContent = 'ACCESS GRANTED. WELCOME, OPERATOR.';
    window.setTimeout(() => {
      bootScreen.classList.add('hidden');
      bootScreen.setAttribute('aria-hidden', 'true');
    }, reducedMotion.matches ? 0 : 240);
  }

  function runBoot() {
    bootTick = 0;
    booted = false;
    bootScreen.classList.remove('hidden');
    bootScreen.removeAttribute('aria-hidden');
    bootProgress.style.width = '0%';
    bootOutput.textContent = bootMessages[0];
    if (bootInterval !== null) window.clearInterval(bootInterval);
    if (reducedMotion.matches) {
      finishBoot();
      return;
    }
    bootInterval = window.setInterval(() => {
      bootTick += 1;
      bootProgress.style.width = `${Math.min(100, bootTick * 9)}%`;
      const messageIndex = Math.min(bootMessages.length - 1, Math.floor(bootTick / 3));
      bootOutput.textContent = bootMessages[messageIndex];
      if (bootTick >= 12) finishBoot();
    }, 145);
  }
  skipBoot.addEventListener('click', finishBoot);
  runBoot();

  function showStartMenu(show) {
    startMenu.hidden = !show;
    startButton.setAttribute('aria-expanded', String(show));
  }
  startButton.addEventListener('click', () => showStartMenu(startMenu.hidden));
  document.addEventListener('pointerdown', event => {
    if (!startMenu.hidden && !startMenu.contains(event.target) && !startButton.contains(event.target)) {
      showStartMenu(false);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') showStartMenu(false);
  });
  document.getElementById('rebootButton').addEventListener('click', () => {
    showStartMenu(false);
    runBoot();
  });

  function getWindow(name) {
    return document.querySelector(`[data-window="${name}"]`);
  }

  function updateTaskbar() {
    taskPrograms.forEach(btn => {
      const win = getWindow(btn.dataset.open);
      btn.classList.toggle('selected', !!win && win.classList.contains('visible'));
      btn.setAttribute('aria-pressed', String(!!win && win.classList.contains('visible')));
    });
  }

  function focusWindow(win) {
    windows.forEach(item => item.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = String(++zIndex);
    const focusedBtn = document.querySelector(`.desktop-shortcut[data-open="${win.dataset.window}"]`);
    document.querySelectorAll('.desktop-shortcut').forEach(btn => btn.classList.toggle('active', btn === focusedBtn));
  }

  function openWindow(name) {
    const win = getWindow(name);
    if (!win) return;
    win.classList.add('visible');
    focusWindow(win);
    updateTaskbar();
    showStartMenu(false);
    if (window.matchMedia('(max-width: 850px)').matches) {
      win.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    if (name === 'terminal') {
      window.setTimeout(() => terminalInput.focus({ preventScroll: true }), 120);
    }
    statusMessage.textContent = `PROCESS OPENED // ${name.toUpperCase()}`;
  }

  openButtons.forEach(button => button.addEventListener('click', () => openWindow(button.dataset.open)));
  windows.forEach(win => {
    win.addEventListener('pointerdown', () => focusWindow(win));
    win.querySelector('[data-close]').addEventListener('click', () => {
      win.classList.remove('visible', 'maximized');
      updateTaskbar();
      statusMessage.textContent = `PROCESS CLOSED // ${win.dataset.window.toUpperCase()}`;
    });
    win.querySelector('[data-minimize]').addEventListener('click', () => {
      win.classList.remove('visible');
      updateTaskbar();
    });
    win.querySelector('[data-maximize]').addEventListener('click', () => {
      win.classList.toggle('maximized');
      focusWindow(win);
    });
  });
  updateTaskbar();
  getWindow('about').style.zIndex = String(++zIndex);
  windows.forEach(win => {
    const titlebar = win.querySelector('.window-titlebar');
    let drag = null;
    titlebar.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button') ||
          window.matchMedia('(max-width: 850px)').matches || win.classList.contains('maximized')) return;
      focusWindow(win);
      const bounds = win.getBoundingClientRect();
      const workspace = desktop.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        desktopX: workspace.left,
        desktopY: workspace.top
      };
      titlebar.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    titlebar.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const left = Math.max(0, Math.min(desktop.clientWidth - win.offsetWidth, event.clientX - drag.desktopX - drag.offsetX));
      const top = Math.max(0, Math.min(desktop.clientHeight - 42, event.clientY - drag.desktopY - drag.offsetY));
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    });
    const endDrag = () => { drag = null; };
    titlebar.addEventListener('pointerup', endDrag);
    titlebar.addEventListener('pointercancel', endDrag);
    titlebar.addEventListener('lostpointercapture', endDrag);
  });

  const commandHelp = [
    'AVAILABLE COMMANDS:',
    'help           show command list',
    'about          display identity',
    'projects       open projects window',
    'noctum         show featured web project',
    'municipal      show delivered web system',
    'work           show employment status',
    'stack          open skills & tools',
    'contact        open contact file',
    'github         show GitHub profile',
    'whoami         reveal operator',
    'date           show local date',
    'matrix         toggle binary rain',
    'clear          clear this terminal',
    'reboot         restart the interface',
    'echo [text]    repeat your message',
    'rengoku        secret command'
  ].join('\n');

  function terminalLine(message, cssClass = 'terminal-line') {
    const line = document.createElement('p');
    line.className = cssClass;
    line.textContent = message;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function executeTerminal(commandRaw) {
    const command = commandRaw.trim();
    if (!command) return;
    terminalLine(`deill@system:~$ ${command}`, 'terminal-command');
    const lower = command.toLowerCase();
    const base = lower.split(/\s+/)[0];
    switch (base) {
      case 'help': terminalLine(commandHelp); break;
      case 'about': terminalLine('DEILL // Software developer from Chile. Builder of software, communities and systems.'); break;
      case 'whoami': terminalLine('deill - operator / architect of delightful chaos.'); break;
      case 'projects': openWindow('projects'); terminalLine('Mounted /work/projects/ - 5 entries.'); break;
      case 'noctum': openWindow('projects'); document.getElementById('noctumProject')?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); terminalLine('NOCTUM // Public web project. More details in PROJECTS.dir.'); break;
      case 'municipal': openWindow('projects'); document.getElementById('municipalProject')?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); terminalLine('Committee management system // DELIVERED; NOT DEPLOYED. No institutional data displayed.'); break;
      case 'work': openWindow('contact'); terminalLine('AVAILABLE // Remote development & web projects. GitHub: https://github.com/deillciph'); break;
      case 'stack': case 'skills': openWindow('stack'); terminalLine('Loaded languages, frameworks and tooling.'); break;
      case 'contact': openWindow('contact'); terminalLine('Contact file opened. GitHub: https://github.com/deillciph'); break;
      case 'github': openWindow('contact'); terminalLine('GITHUB // https://github.com/deillciph'); break;
      case 'date': terminalLine(new Date().toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'medium' })); break;
      case 'matrix':
        rainEnabled = !rainEnabled;
        toggleRain.checked = rainEnabled;

        if (rainEnabled) startRain(); else stopRain();
        terminalLine(`Binary rain: ${rainEnabled ? 'ENABLED' : 'DISABLED'}.`);
        break;
      case 'echo': terminalLine(command.slice(4).trim() || '(empty)'); break;
      case 'clear': terminalOutput.replaceChildren(); break;
      case 'reboot': terminalLine('Rebooting visual system...'); runBoot(); break;
      case 'rengoku': terminalLine('🔥 UMAI! - The Flame Hashira approves this interface.'); break;
      case 'sudo': terminalLine('Permission denied. This is a portfolio, not a real machine.', 'terminal-error'); break;
      case 'hack': terminalLine('DEMO MODE // No intrusion is performed. Just stylish CSS and JavaScript.'); break;
      default: terminalLine(`Command not found: ${base}. Type 'help'.`, 'terminal-error');
    }
  }
  terminalForm.addEventListener('submit', event => {
    event.preventDefault();
    const value = terminalInput.value;
    terminalInput.value = '';
    executeTerminal(value);
  });

  function fitRain() {
    if (!ctx) return;
    const rect = desktop.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    rainWidth = Math.round(rect.width);
    rainHeight = Math.round(rect.height);
    canvas.width = Math.max(1, Math.round(rainWidth * ratio));
    canvas.height = Math.max(1, Math.round(rainHeight * ratio));
    canvas.style.width = `${rainWidth}px`;
    canvas.style.height = `${rainHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(95, Math.ceil(rainWidth / 23));
    columns = Array.from({ length: count }, (_, index) => ({
      x: index * 23 + 8,
      y: Math.random() * (rainHeight + 700) - 700,
      speed: 0.8 + Math.random() * 1.3,
      length: 8 + Math.floor(Math.random() * 16),
      seed: Math.floor(Math.random() * 1000)
    }));
    if (!rainEnabled) drawRain(0, false);
  }

  function drawRain(timestamp, advance = true) {
    if (!ctx) return;
    ctx.clearRect(0, 0, rainWidth, rainHeight);
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = 'center';
    for (const column of columns) {
      const step = 17;
      for (let i = 0; i < column.length; i++) {
        const y = column.y - i * step;
        if (y < -15 || y > rainHeight + 20) continue;
        const brightness = 1 - (i / column.length);
        const alpha = (i === 0 ? 0.85 : Math.pow(brightness, 1.7) * 0.46);
        ctx.fillStyle = i === 0 ? `rgba(255,116,130,${alpha})` : `rgba(232,35,66,${alpha})`;
        const digit = ((Math.floor(timestamp / 260) + i * 13 + column.seed) % 7 < 3) ? '0' : '1';
        ctx.fillText(digit, column.x, y);
      }
      if (advance) {
        column.y += column.speed * 1.9;
        if (column.y - column.length * step > rainHeight) {
          column.y = -30 - Math.random() * 300;
          column.speed = 0.8 + Math.random() * 1.3;
        }
      }
    }
  }

  function animate(timestamp) {
    if (!rainEnabled || document.hidden || reducedMotion.matches) {
      raf = 0;
      return;
    }
    if (timestamp - lastFrame > 55) {
      lastFrame = timestamp;
      drawRain(timestamp);
    }
    raf = window.requestAnimationFrame(animate);
  }
  function startRain() {
    rainEnabled = true;
    toggleRain.checked = true;
    if (!ctx) return;
    if (reducedMotion.matches) { drawRain(0, false); return; }
    if (!raf && !document.hidden) raf = window.requestAnimationFrame(animate);
  }
  function stopRain() {
    rainEnabled = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, rainWidth, rainHeight);
  }
  fitRain();
  if (rainEnabled) startRain(); else if (ctx) drawRain(0, false);
  window.addEventListener('resize', fitRain);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { window.cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && rainEnabled) startRain();
  });
  toggleRain.addEventListener('change', () => {
    if (toggleRain.checked) startRain(); else stopRain();
  });
  toggleScanlines.addEventListener('change', () => {
    scanlines.style.display = toggleScanlines.checked ? '' : 'none';
  });
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches && raf) { window.cancelAnimationFrame(raf); raf = 0; drawRain(0, false); }
    else if (rainEnabled) startRain();
  });
})();
