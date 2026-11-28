// Sudhan AI Video Ads - Interactive Scripts

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. HERO VIDEO SOUND TOGGLE
  // -------------------------------------------------------------
  const heroVideo = document.getElementById('hero-video');
  const heroSoundToggle = document.getElementById('hero-sound-toggle');
  const heroSoundIconMuted = document.getElementById('hero-sound-icon-muted');
  const heroSoundIconUnmuted = document.getElementById('hero-sound-icon-unmuted');

  if (heroSoundToggle && heroVideo) {
    heroSoundToggle.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      if (heroVideo.muted) {
        heroSoundIconMuted.classList.remove('hidden');
        heroSoundIconUnmuted.classList.add('hidden');
      } else {
        heroSoundIconMuted.classList.add('hidden');
        heroSoundIconUnmuted.classList.remove('hidden');
        heroVideo.play().catch(() => {});
      }
    });
  }

  // -------------------------------------------------------------
  // 2. PORTFOLIO VIDEOS (Pause others on play)
  // -------------------------------------------------------------
  const portfolioVideos = [
    document.getElementById('portfolio-video-1'),
    document.getElementById('portfolio-video-2'),
    document.getElementById('portfolio-video-3')
  ].filter(Boolean);

  portfolioVideos.forEach(video => {
    video.addEventListener('play', () => {
      // Pause other portfolio videos
      portfolioVideos.forEach(other => {
        if (other !== video && !other.paused) {
          other.pause();
        }
      });
      // Mute hero video if playing
      if (heroVideo && !heroVideo.muted) {
        heroVideo.muted = true;
        if (heroSoundIconMuted && heroSoundIconUnmuted) {
          heroSoundIconMuted.classList.remove('hidden');
          heroSoundIconUnmuted.classList.add('hidden');
        }
      }
    });
  });

  // -------------------------------------------------------------
  // 3. FAQ ACCORDION
  // -------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const toggleBtn = item.querySelector('.faq-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close all other items
        faqItems.forEach(other => {
          other.classList.remove('active');
          const btn = other.querySelector('.faq-toggle');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('active');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // -------------------------------------------------------------
  // 4. GAME 1: TERRIER TREAT CATCH (CANVAS GAME)
  // -------------------------------------------------------------
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('game-score');
  const timerEl = document.getElementById('game-timer');
  const livesEl = document.getElementById('game-lives');
  const startScreen = document.getElementById('game-start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const startBtn = document.getElementById('start-game-btn');
  const restartBtn = document.getElementById('restart-game-btn');
  const finalScoreEl = document.getElementById('final-score');
  const bestScoreEl = document.getElementById('best-score');
  const gameOverTitle = document.getElementById('game-over-title');
  const gameOverEmoji = document.getElementById('game-over-emoji');
  const btnMoveLeft = document.getElementById('btn-move-left');
  const btnMoveRight = document.getElementById('btn-move-right');

  // Canvas logical dimensions
  const V_WIDTH = 600;
  const V_HEIGHT = 400;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.resetTransform?.();
    ctx.scale((rect.width * dpr) / V_WIDTH, (rect.height * dpr) / V_HEIGHT);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Game state
  let isPlaying = false;
  let score = 0;
  let lives = 3;
  let timeLeft = 30;
  let timerInterval = null;
  let animationFrameId = null;
  let items = [];
  let itemSpawnTimer = 0;
  let flashRedDuration = 0;

  // Terrier Player
  const terrier = {
    x: V_WIDTH / 2 - 30,
    y: V_HEIGHT - 65,
    width: 60,
    height: 48,
    speed: 7,
    movingLeft: false,
    movingRight: false,
    facingLeft: false,
    tailWag: 0
  };

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      terrier.movingLeft = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      terrier.movingRight = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      terrier.movingLeft = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      terrier.movingRight = false;
    }
  });

  // Touch / Button controls
  function bindHoldButton(btn, onStart, onEnd) {
    if (!btn) return;
    const startHandler = (e) => {
      e.preventDefault();
      onStart();
    };
    const endHandler = (e) => {
      e.preventDefault();
      onEnd();
    };
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
  }

  bindHoldButton(btnMoveLeft, () => { terrier.movingLeft = true; }, () => { terrier.movingLeft = false; });
  bindHoldButton(btnMoveRight, () => { terrier.movingRight = true; }, () => { terrier.movingRight = false; });

  // Direct canvas pointer/touch drag
  let isPointerDown = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (!isPlaying) return;
    isPointerDown = true;
    updateTerrierFromPointer(e);
  });
  window.addEventListener('pointermove', (e) => {
    if (!isPlaying || !isPointerDown) return;
    updateTerrierFromPointer(e);
  });
  window.addEventListener('pointerup', () => { isPointerDown = false; });
  window.addEventListener('pointercancel', () => { isPointerDown = false; });

  function updateTerrierFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const targetX = relativeX * V_WIDTH - terrier.width / 2;
    terrier.x = Math.max(10, Math.min(V_WIDTH - terrier.width - 10, targetX));
  }

  // Draw scruffy terrier dog (simple shapes & canvas paths - no photo)
  function drawTerrier(x, y, width, height, facingLeft, wag) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    if (facingLeft) {
      ctx.scale(-1, 1);
    }

    // Scruffy Fur Color: warm beige/grey-tan
    const furColor = '#C29B70';
    const darkFur = '#966F43';
    const snoutColor = '#E6D3B3';

    // Tail (wagging)
    ctx.save();
    ctx.translate(-22, -4);
    ctx.rotate(Math.sin(wag) * 0.35 - 0.4);
    ctx.fillStyle = darkFur;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-4, -18, 8, 20, 4) : ctx.rect(-4, -18, 8, 20);
    ctx.fill();
    ctx.restore();

    // Body (scruffy oval)
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / paws
    ctx.fillStyle = darkFur;
    ctx.fillRect(-18, 14, 7, 10);
    ctx.fillRect(-6, 14, 7, 10);
    ctx.fillRect(8, 14, 7, 10);
    ctx.fillRect(16, 14, 7, 10);

    // Collar (amber/red)
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(4, -4, 6, 16);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(7, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head (fluffy round/scruffy shape)
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.arc(14, -8, 15, 0, Math.PI * 2);
    ctx.fill();

    // Scruffy tufts on head / cheeks
    ctx.fillStyle = darkFur;
    ctx.beginPath();
    ctx.moveTo(14, -22);
    ctx.lineTo(17, -27);
    ctx.lineTo(20, -22);
    ctx.fill();

    // Ear (pointy / folded scruffy terrier ear)
    ctx.fillStyle = darkFur;
    ctx.beginPath();
    ctx.moveTo(6, -20);
    ctx.lineTo(2, -30);
    ctx.lineTo(14, -22);
    ctx.closePath();
    ctx.fill();

    // Snout / muzzle
    ctx.fillStyle = snoutColor;
    ctx.beginPath();
    ctx.ellipse(22, -4, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black nose
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(28, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(18, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(17.5, -12, 1, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers / Scruff beard
    ctx.strokeStyle = darkFur;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(22, 1);
    ctx.lineTo(26, 6);
    ctx.moveTo(25, -2);
    ctx.lineTo(30, 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Treat (Bone/Biscuit)
  function drawTreat(x, y, radius) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing aura
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Bone shape
    ctx.fillStyle = '#F59E0B';
    // Center bar
    ctx.fillRect(-10, -4, 20, 8);
    // 4 bone nubs
    ctx.beginPath();
    ctx.arc(-10, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(-10, 4, 4.5, 0, Math.PI * 2);
    ctx.arc(10, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(10, 4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Biscuit shine
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-6, -2, 12, 3);

    ctx.restore();
  }

  // Draw Falling Shoe (Hazard)
  function drawShoe(x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Hazard aura
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
    ctx.fill();

    // Sneaker/Shoe shape
    ctx.fillStyle = '#3B82F6'; // sneaker body
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(14, 8);
    ctx.lineTo(14, 2);
    ctx.lineTo(4, 2);
    ctx.lineTo(0, -10);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    // White sole
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-15, 8, 30, 5);

    // Shoe laces
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(1, -6);
    ctx.moveTo(-5, -2);
    ctx.lineTo(2, -2);
    ctx.stroke();

    ctx.restore();
  }

  function spawnItem() {
    const isShoe = Math.random() < 0.28; // ~28% shoes, 72% treats
    const item = {
      x: 30 + Math.random() * (V_WIDTH - 60),
      y: -20,
      radius: 14,
      isShoe: isShoe,
      speed: 3 + Math.random() * 2.5 + (30 - timeLeft) * 0.08
    };
    items.push(item);
  }

  function updateGame() {
    if (!isPlaying) return;

    // Move terrier
    if (terrier.movingLeft) {
      terrier.x -= terrier.speed;
      terrier.facingLeft = true;
      terrier.tailWag += 0.25;
    }
    if (terrier.movingRight) {
      terrier.x += terrier.speed;
      terrier.facingLeft = false;
      terrier.tailWag += 0.25;
    }
    terrier.x = Math.max(10, Math.min(V_WIDTH - terrier.width - 10, terrier.x));

    // Spawn items
    itemSpawnTimer++;
    if (itemSpawnTimer > 40) {
      spawnItem();
      itemSpawnTimer = 0;
    }

    // Update items & check collisions
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.speed;

      // Check collision with terrier
      const terrierBox = {
        left: terrier.x,
        right: terrier.x + terrier.width,
        top: terrier.y,
        bottom: terrier.y + terrier.height
      };

      if (
        it.x + it.radius > terrierBox.left &&
        it.x - it.radius < terrierBox.right &&
        it.y + it.radius > terrierBox.top &&
        it.y - it.radius < terrierBox.bottom
      ) {
        // Collided!
        if (it.isShoe) {
          lives--;
          flashRedDuration = 10;
          updateLivesUI();
          if (lives <= 0) {
            endGame(false);
            return;
          }
        } else {
          score += 10;
          scoreEl.textContent = score;
        }
        items.splice(i, 1);
        continue;
      }

      // Out of bounds
      if (it.y > V_HEIGHT + 20) {
        items.splice(i, 1);
      }
    }

    // Draw frame
    renderGame();

    animationFrameId = requestAnimationFrame(updateGame);
  }

  function renderGame() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    bgGrad.addColorStop(0, '#0B0F19');
    bgGrad.addColorStop(1, '#05070D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Floor line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, V_HEIGHT - 18, V_WIDTH, 2);

    // Red screen flash when hit by shoe
    if (flashRedDuration > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${flashRedDuration * 0.04})`;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      flashRedDuration--;
    }

    // Draw falling items
    items.forEach(it => {
      if (it.isShoe) {
        drawShoe(it.x, it.y, it.radius);
      } else {
        drawTreat(it.x, it.y, it.radius);
      }
    });

    // Draw player
    drawTerrier(terrier.x, terrier.y, terrier.width, terrier.height, terrier.facingLeft, terrier.tailWag);
  }

  function updateLivesUI() {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < lives ? '<span>❤️</span>' : '<span class="opacity-20 grayscale">💔</span>';
    }
    livesEl.innerHTML = hearts;
  }

  function startGame() {
    score = 0;
    lives = 3;
    timeLeft = 30;
    items = [];
    itemSpawnTimer = 0;
    terrier.x = V_WIDTH / 2 - 30;
    terrier.movingLeft = false;
    terrier.movingRight = false;

    scoreEl.textContent = '0';
    timerEl.textContent = '30s';
    updateLivesUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('flex');
    isPlaying = true;

    resizeCanvas();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        endGame(true);
      }
    }, 1000);

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateGame);
  }

  function endGame(timeFinished) {
    isPlaying = false;
    if (timerInterval) clearInterval(timerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // LocalStorage best score
    const currentBest = parseInt(localStorage.getItem('terrier_best_score') || '0', 10);
    const newBest = Math.max(currentBest, score);
    localStorage.setItem('terrier_best_score', newBest.toString());

    finalScoreEl.textContent = score;
    bestScoreEl.textContent = newBest;

    if (timeFinished) {
      gameOverTitle.textContent = "Time's Up!";
      gameOverEmoji.textContent = score > 100 ? '🏆' : '🎉';
    } else {
      gameOverTitle.textContent = 'Out of Lives!';
      gameOverEmoji.textContent = '🐾';
    }

    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('flex');
  }

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', startGame);

  // Initial canvas render preview
  renderGame();

  // -------------------------------------------------------------
  // 5. GAME 2: FIND YOUR VIDEO STYLE QUIZ
  // -------------------------------------------------------------
  const quizQ1 = document.getElementById('quiz-q1');
  const quizQ2 = document.getElementById('quiz-q2');
  const quizQ3 = document.getElementById('quiz-q3');
  const quizResult = document.getElementById('quiz-result');
  const quizStepIndicator = document.getElementById('quiz-step-indicator');
  const retakeBtn = document.getElementById('retake-quiz-btn');

  const quizResTitle = document.getElementById('quiz-res-title');
  const quizResBadge = document.getElementById('quiz-res-badge');
  const quizResDesc = document.getElementById('quiz-res-desc');
  const quizResFeatures = document.getElementById('quiz-res-features');

  let quizAnswers = {
    q1: null,
    q2: null,
    q3: null
  };

  const optionButtons = document.querySelectorAll('.quiz-opt-btn');
  optionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const qNum = btn.getAttribute('data-q');
      const val = btn.getAttribute('data-val');

      if (qNum === '1') {
        quizAnswers.q1 = val;
        quizQ1.classList.add('hidden');
        quizQ2.classList.remove('hidden');
        quizStepIndicator.textContent = 'Step 2 of 3';
      } else if (qNum === '2') {
        quizAnswers.q2 = val;
        quizQ2.classList.add('hidden');
        quizQ3.classList.remove('hidden');
        quizStepIndicator.textContent = 'Step 3 of 3';
      } else if (qNum === '3') {
        quizAnswers.q3 = val;
        quizQ3.classList.add('hidden');
        showQuizResult(quizAnswers.q3);
      }
    });
  });

  function showQuizResult(budgetChoice) {
    quizStepIndicator.textContent = 'Recommendation';
    quizResult.classList.remove('hidden');

    // Packages specs
    if (budgetChoice === 'Under $100') {
      // Basic $75
      quizResTitle.textContent = 'Basic $75';
      quizResBadge.textContent = 'Fast & Punchy';
      quizResDesc.textContent = `Perfect for ${quizAnswers.q1} promos on ${quizAnswers.q2} under $100.`;
      quizResFeatures.innerHTML = `
        <li class="flex items-center gap-2">✓ Up to 15 seconds</li>
        <li class="flex items-center gap-2">✓ Professional voiceover</li>
        <li class="flex items-center gap-2">✓ Original music and sound effects</li>
        <li class="flex items-center gap-2">✓ Vertical 9:16 format</li>
        <li class="flex items-center gap-2">✓ 1 revision • Delivery in 2 days</li>
        <li class="flex items-center gap-2 font-semibold text-amber-400">✓ Full commercial rights</li>
      `;
    } else if (budgetChoice === '$100–200') {
      // Standard $175
      quizResTitle.textContent = 'Standard $175';
      quizResBadge.textContent = 'Most Popular';
      quizResDesc.textContent = `The full cinematic story treatment for ${quizAnswers.q1} ads on ${quizAnswers.q2}.`;
      quizResFeatures.innerHTML = `
        <li class="flex items-center gap-2 font-semibold text-white">✓ Up to 30 seconds</li>
        <li class="flex items-center gap-2">✓ Voiceover, music and sound effects</li>
        <li class="flex items-center gap-2">✓ Vertical 9:16 format</li>
        <li class="flex items-center gap-2">✓ 2 revisions • Delivery in 3 days</li>
        <li class="flex items-center gap-2 font-semibold text-amber-400">✓ Full commercial rights</li>
      `;
    } else {
      // $200 and up -> Premium $350
      quizResTitle.textContent = 'Premium $350';
      quizResBadge.textContent = 'Full Multi-Format';
      quizResDesc.textContent = `Maximum reach across feeds, stories and widescreen for ${quizAnswers.q1} campaigns.`;
      quizResFeatures.innerHTML = `
        <li class="flex items-center gap-2 font-semibold text-white">✓ Up to 60s or 3 x 15s videos</li>
        <li class="flex items-center gap-2">✓ Voiceover, music and sound effects</li>
        <li class="flex items-center gap-2 font-semibold text-amber-400">✓ Formats: 9:16 + 16:9 + 1:1</li>
        <li class="flex items-center gap-2">✓ 3 revisions • Delivery in 4 days</li>
        <li class="flex items-center gap-2">✓ Full commercial rights</li>
      `;
    }
  }

  function resetQuiz() {
    quizAnswers = { q1: null, q2: null, q3: null };
    quizResult.classList.add('hidden');
    quizQ3.classList.add('hidden');
    quizQ2.classList.add('hidden');
    quizQ1.classList.remove('hidden');
    quizStepIndicator.textContent = 'Step 1 of 3';
  }

  if (retakeBtn) {
    retakeBtn.addEventListener('click', resetQuiz);
  }
});
