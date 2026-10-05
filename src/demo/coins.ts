interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  spin: number;
  phase: number;
  life: number;
  bee: boolean;
}

// 斗內掉落：金幣由上灑下、落地彈跳後淡出；畫布尺寸跟著容器走。
export function createCoins(host: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.className = 'coins';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const coins: Coin[] = [];
  let w = 0;
  let h = 0;
  let dpr = 1;
  let running = false;

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  };
  new ResizeObserver(resize).observe(host);
  resize();

  function drawCoin(c: Coin) {
    const sx = Math.abs(Math.cos(c.phase));
    ctx.save();
    ctx.globalAlpha = Math.min(1, c.life);
    ctx.translate(c.x, c.y);
    ctx.scale(Math.max(0.12, sx), 1);
    const g = ctx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, c.r * 0.1, 0, 0, c.r);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.55, '#ffc21a');
    g.addColorStop(1, '#c98a00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = c.r * 0.14;
    ctx.strokeStyle = '#a86f00';
    ctx.stroke();
    if (sx > 0.45) {
      ctx.fillStyle = '#a86f00';
      ctx.font = `900 ${c.r}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.bee ? '♥' : '$', 0, c.r * 0.06);
    }
    ctx.restore();
  }

  function tick() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const floor = h - 6;
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.vy += 0.42;
      c.x += c.vx;
      c.y += c.vy;
      c.phase += c.spin;
      if (c.y + c.r > floor) {
        c.y = floor - c.r;
        c.vy *= -0.42;
        c.vx *= 0.8;
        c.life -= 0.18;
      }
      if (c.y > floor - c.r - 1) c.life -= 0.012;
      if (c.life <= 0 || c.x < -40 || c.x > w + 40) coins.splice(i, 1);
      else drawCoin(c);
    }
    if (coins.length) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }

  return {
    drop(count: number, burstFrom?: { x: number; y: number }) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const scale = Math.max(0.6, w / 900);
      for (let i = 0; i < count; i++) {
        const fromBurst = burstFrom && i % 2 === 0;
        coins.push({
          x: fromBurst ? burstFrom!.x * w : Math.random() * w,
          y: fromBurst ? burstFrom!.y * h : -20 - Math.random() * h * 0.6,
          vx: fromBurst ? (Math.random() - 0.5) * 9 : (Math.random() - 0.5) * 1.6,
          vy: fromBurst ? -6 - Math.random() * 6 : Math.random() * 2,
          r: (9 + Math.random() * 8) * scale,
          spin: 0.08 + Math.random() * 0.14,
          phase: Math.random() * Math.PI,
          life: 1.6,
          bee: Math.random() < 0.25,
        });
      }
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    },
    clear() {
      coins.length = 0;
    },
  };
}
