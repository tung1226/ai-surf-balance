const PASS_SCORE = 78;
const HOLD_MS = 1500;
const MIN_KEYPOINT_SCORE = 0.28;

const EDGES = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"]
];

const STEPS = [
  {
    tag: "STEP 1",
    title: "趴板與划水",
    ready: "身體放平，胸口微抬，雙腿伸直。",
    pass: "趴板平衡過關。",
    improve: "把身體放得更水平，膝蓋伸直，胸口稍微離開板面。",
    checks: [
      {
        label: "身體接近板面水平",
        value: (m) => formatDegree(m.torsoHorizontal),
        score: (m) => scoreNear(m.torsoHorizontal, 0, 16, 48)
      },
      {
        label: "雙腿伸直",
        value: (m) => formatDegree(m.kneeStraightness),
        score: (m) => scoreMin(m.kneeStraightness, 158, 118)
      },
      {
        label: "胸口微抬",
        value: (m) => formatRatio(m.shoulderRise),
        score: (m) => scoreMin(m.shoulderRise, 0.04, -0.08)
      },
      {
        label: "雙手在身體兩側",
        value: (m) => formatRatio(m.handDrop),
        score: (m) => scoreRange(m.handDrop, 0.03, 0.58, 0.22)
      }
    ]
  },
  {
    tag: "STEP 2",
    title: "雙手撐板",
    ready: "雙手靠近胸口兩側，手臂撐直，上半身抬起。",
    pass: "撐板姿勢過關。",
    improve: "手臂再打直一些，肩膀抬高，手掌靠近肩膀下方。",
    checks: [
      {
        label: "手臂打直",
        value: (m) => formatDegree(m.elbowStraightness),
        score: (m) => scoreMin(m.elbowStraightness, 154, 112)
      },
      {
        label: "上半身抬起",
        value: (m) => formatDegree(m.torsoHorizontal),
        score: (m) => scoreRange(m.torsoHorizontal, 24, 72, 24)
      },
      {
        label: "肩膀高於髖部",
        value: (m) => formatRatio(m.shoulderRise),
        score: (m) => scoreMin(m.shoulderRise, 0.12, 0)
      },
      {
        label: "手掌靠近肩線",
        value: (m) => formatRatio(m.wristShoulderOffset),
        score: (m) => scoreMax(m.wristShoulderOffset, 1.15, 2.25)
      }
    ]
  },
  {
    tag: "STEP 3",
    title: "起乘收腳",
    ready: "前腳快速跨入，後腳跟上，身體保持低姿。",
    pass: "起乘收腳過關。",
    improve: "腳距再拉開，膝蓋彎曲，手保持接近板面。",
    checks: [
      {
        label: "膝蓋彎曲蓄力",
        value: (m) => formatDegree(m.kneeStraightness),
        score: (m) => scoreRange(m.kneeStraightness, 68, 138, 42)
      },
      {
        label: "前後腳有距離",
        value: (m) => formatRatio(m.ankleSpread),
        score: (m) => scoreMin(m.ankleSpread, 1.05, 0.42)
      },
      {
        label: "身體低而向前",
        value: (m) => formatDegree(m.torsoHorizontal),
        score: (m) => scoreRange(m.torsoHorizontal, 30, 76, 28)
      },
      {
        label: "雙手仍接近板面",
        value: (m) => formatRatio(m.handDrop),
        score: (m) => scoreMin(m.handDrop, 0.24, 0.02)
      }
    ]
  },
  {
    tag: "STEP 4",
    title: "浪上站姿",
    ready: "側身站穩，膝蓋微蹲，雙手自然張開。",
    pass: "浪上站姿過關。",
    improve: "腳距再穩一點，膝蓋微彎，雙手打開幫助平衡。",
    checks: [
      {
        label: "側身站立穩定",
        value: (m) => formatDegree(m.torsoHorizontal),
        score: (m) => scoreRange(m.torsoHorizontal, 58, 90, 24)
      },
      {
        label: "雙腳前後站距",
        value: (m) => formatRatio(m.ankleSpread),
        score: (m) => scoreMin(m.ankleSpread, 1.25, 0.58)
      },
      {
        label: "膝蓋微蹲",
        value: (m) => formatDegree(m.kneeStraightness),
        score: (m) => scoreRange(m.kneeStraightness, 88, 158, 34)
      },
      {
        label: "雙臂張開平衡",
        value: (m) => formatRatio(m.wristSpread),
        score: (m) => scoreMin(m.wristSpread, 1.45, 0.72)
      }
    ]
  }
];

const dom = {
  modelStatus: document.getElementById("modelStatus"),
  completedCount: document.getElementById("completedCount"),
  stepList: document.getElementById("stepList"),
  stepCards: [...document.querySelectorAll(".step-card")],
  cameraFeed: document.getElementById("cameraFeed"),
  poseCanvas: document.getElementById("poseCanvas"),
  stagePlaceholder: document.getElementById("stagePlaceholder"),
  currentStepTag: document.getElementById("currentStepTag"),
  currentStepTitle: document.getElementById("currentStepTitle"),
  holdText: document.getElementById("holdText"),
  holdMeter: document.getElementById("holdMeter"),
  startButton: document.getElementById("startButton"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
  mirrorToggle: document.getElementById("mirrorToggle"),
  passState: document.getElementById("passState"),
  scoreDial: document.getElementById("scoreDial"),
  scoreValue: document.getElementById("scoreValue"),
  feedbackText: document.getElementById("feedbackText"),
  metricList: document.getElementById("metricList")
};

const state = {
  detector: null,
  stream: null,
  detecting: false,
  currentStep: 0,
  holdStart: 0,
  passed: STEPS.map(() => false),
  lastScore: 0
};

dom.startButton.addEventListener("click", startApp);
dom.prevButton.addEventListener("click", () => selectStep(state.currentStep - 1));
dom.nextButton.addEventListener("click", () => selectStep(state.currentStep + 1));
dom.mirrorToggle.addEventListener("change", updateMirror);
dom.stepList.addEventListener("click", (event) => {
  const card = event.target.closest(".step-card");
  if (!card) return;
  selectStep(Number(card.dataset.step));
});

renderStep();
renderEmptyMetrics();
updateMirror();

async function startApp() {
  dom.startButton.disabled = true;
  setStatus("載入模型中...");

  try {
    await ensureModel();
    await ensureCamera();
    dom.stagePlaceholder.classList.add("is-hidden");
    dom.startButton.textContent = "鏡頭運作中";
    setStatus("已啟動", "is-ready");

    if (!state.detecting) {
      state.detecting = true;
      requestAnimationFrame(detectLoop);
    }
  } catch (error) {
    console.error(error);
    dom.startButton.disabled = false;
    dom.startButton.textContent = "重新啟動";
    setStatus("啟動失敗", "is-error");
    dom.feedbackText.textContent = error.message || "鏡頭或姿勢模型無法啟動。";
  }
}

async function ensureModel() {
  if (state.detector) return;
  if (!window.tf || !window.poseDetection) {
    throw new Error("姿勢模型尚未載入，請確認網路連線後重新整理。");
  }

  try {
    await tf.setBackend("webgl");
  } catch (error) {
    console.warn("WebGL backend unavailable, falling back to CPU.", error);
    await tf.setBackend("cpu");
  }
  await tf.ready();

  state.detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true
    }
  );
}

async function ensureCamera() {
  if (state.stream) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("這個瀏覽器不支援鏡頭存取。");
  }

  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    }
  });

  dom.cameraFeed.srcObject = state.stream;
  await new Promise((resolve) => {
    dom.cameraFeed.onloadedmetadata = resolve;
  });
  await dom.cameraFeed.play();
  resizeCanvas();
}

async function detectLoop() {
  if (!state.detecting || !state.detector) return;

  if (dom.cameraFeed.readyState >= 2) {
    resizeCanvas();
    const poses = await state.detector.estimatePoses(dom.cameraFeed, {
      maxPoses: 1,
      flipHorizontal: false
    });

    const pose = poses[0];
    drawPose(pose);
    updateScore(pose);
  }

  requestAnimationFrame(detectLoop);
}

function updateScore(pose) {
  if (!pose || !pose.keypoints?.length) {
    state.holdStart = 0;
    state.lastScore = 0;
    renderScore(0, [], "找不到身體，請讓全身進入畫面。", false, 0);
    return;
  }

  const metrics = buildMetrics(pose.keypoints);
  if (!metrics.ready) {
    state.holdStart = 0;
    state.lastScore = 0;
    renderScore(0, [], "關節點不足，請退後一點讓全身入鏡。", false, 0);
    return;
  }

  const step = STEPS[state.currentStep];
  const results = step.checks.map((check) => {
    const score = check.score(metrics);
    return {
      label: check.label,
      value: check.value(metrics),
      score: clamp(score, 0, 1)
    };
  });

  const weighted = results.reduce((sum, result) => sum + result.score, 0) / results.length;
  const visibilityScore = scoreMin(metrics.visibleCount, 13, 7);
  const score = Math.round(clamp(weighted * 0.9 + visibilityScore * 0.1, 0, 1) * 100);
  const passedNow = score >= PASS_SCORE;
  const holdRatio = updateHold(passedNow);

  if (holdRatio >= 1 && !state.passed[state.currentStep]) {
    state.passed[state.currentStep] = true;
    renderStepCards();
  }

  state.lastScore = score;
  const feedback = state.passed[state.currentStep]
    ? step.pass
    : passedNow
      ? "保持住，穩定到時間即可過關。"
      : step.improve;

  renderScore(score, results, feedback, state.passed[state.currentStep], holdRatio);
}

function updateHold(isPassing) {
  const now = performance.now();
  if (!isPassing) {
    state.holdStart = 0;
    return 0;
  }

  if (!state.holdStart) state.holdStart = now;
  return clamp((now - state.holdStart) / HOLD_MS, 0, 1);
}

function buildMetrics(keypoints) {
  const points = Object.fromEntries(keypoints.map((point) => [point.name, point]));
  const visible = keypoints.filter((point) => (point.score || 0) >= MIN_KEYPOINT_SCORE);
  const bounds = getBounds(visible);

  const leftShoulder = point(points, "left_shoulder");
  const rightShoulder = point(points, "right_shoulder");
  const leftHip = point(points, "left_hip");
  const rightHip = point(points, "right_hip");
  const leftKnee = point(points, "left_knee");
  const rightKnee = point(points, "right_knee");
  const leftAnkle = point(points, "left_ankle");
  const rightAnkle = point(points, "right_ankle");
  const leftElbow = point(points, "left_elbow");
  const rightElbow = point(points, "right_elbow");
  const leftWrist = point(points, "left_wrist");
  const rightWrist = point(points, "right_wrist");

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const wristMid = midpoint(leftWrist, rightWrist);
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const bodyScale = Math.max(bounds.width, bounds.height, shoulderWidth * 2.5, 1);
  const safeShoulderWidth = Math.max(shoulderWidth, bodyScale * 0.18, 1);

  const leftElbowAngle = angle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = angle(rightShoulder, rightElbow, rightWrist);
  const leftKneeAngle = angle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = angle(rightHip, rightKnee, rightAnkle);

  const wristShoulderOffset = mean([
    normalizedXOffset(leftWrist, leftShoulder, safeShoulderWidth),
    normalizedXOffset(rightWrist, rightShoulder, safeShoulderWidth)
  ]);

  return {
    ready: Boolean(shoulderMid && hipMid && bounds.count >= 8),
    visibleCount: visible.length,
    torsoHorizontal: lineAngle(shoulderMid, hipMid),
    kneeStraightness: mean([leftKneeAngle, rightKneeAngle]),
    elbowStraightness: mean([leftElbowAngle, rightElbowAngle]),
    shoulderRise: shoulderMid && hipMid ? (hipMid.y - shoulderMid.y) / bodyScale : NaN,
    handDrop: wristMid && shoulderMid ? (wristMid.y - shoulderMid.y) / bodyScale : NaN,
    wristShoulderOffset,
    ankleSpread: distance(leftAnkle, rightAnkle) / safeShoulderWidth,
    wristSpread: distance(leftWrist, rightWrist) / safeShoulderWidth
  };
}

function renderScore(score, results, feedback, passed, holdRatio) {
  const color = score >= PASS_SCORE ? "var(--green)" : score >= 58 ? "var(--amber)" : "var(--coral)";
  dom.scoreDial.style.setProperty("--score", score);
  dom.scoreDial.style.setProperty("--dial-color", color);
  dom.scoreValue.textContent = score;
  dom.passState.textContent = passed ? "過關" : score >= PASS_SCORE ? "保持" : "未過";
  dom.passState.style.color = passed ? "var(--green)" : "";
  dom.feedbackText.textContent = feedback;
  dom.holdText.textContent = `穩定 ${(holdRatio * HOLD_MS / 1000).toFixed(1)} 秒`;
  dom.holdMeter.style.width = `${Math.round(holdRatio * 100)}%`;

  if (!results.length) {
    renderEmptyMetrics();
    return;
  }

  dom.metricList.innerHTML = results.map((result) => {
    const percent = Math.round(result.score * 100);
    const barColor = percent >= 78 ? "var(--green)" : percent >= 58 ? "var(--amber)" : "var(--coral)";
    return `
      <div class="metric-row">
        <span class="metric-name">${result.label}</span>
        <span class="metric-value">${result.value}</span>
        <span class="metric-bar"><span style="width: ${percent}%; --bar-color: ${barColor}"></span></span>
      </div>
    `;
  }).join("");
}

function renderEmptyMetrics() {
  const step = STEPS[state.currentStep];
  dom.metricList.innerHTML = step.checks.map((check) => `
    <div class="metric-row">
      <span class="metric-name">${check.label}</span>
      <span class="metric-value">--</span>
      <span class="metric-bar"><span style="width: 0%"></span></span>
    </div>
  `).join("");
}

function renderStep() {
  const step = STEPS[state.currentStep];
  dom.currentStepTag.textContent = step.tag;
  dom.currentStepTitle.textContent = step.title;
  dom.feedbackText.textContent = step.ready;
  state.holdStart = 0;
  dom.holdText.textContent = "穩定 0.0 秒";
  dom.holdMeter.style.width = "0%";
  renderStepCards();
  renderEmptyMetrics();
}

function renderStepCards() {
  dom.stepCards.forEach((card, index) => {
    const active = index === state.currentStep;
    const passed = state.passed[index];
    card.classList.toggle("is-active", active);
    card.classList.toggle("is-passed", passed);
    card.querySelector(".step-state").textContent = passed ? "過關" : active ? "測驗中" : "未測";
  });

  const completed = state.passed.filter(Boolean).length;
  dom.completedCount.textContent = `${completed}/4`;
}

function selectStep(index) {
  const total = STEPS.length;
  state.currentStep = (index + total) % total;
  renderStep();
}

function updateMirror() {
  const mirrored = dom.mirrorToggle.checked;
  dom.cameraFeed.classList.toggle("is-mirrored", mirrored);
  dom.poseCanvas.classList.toggle("is-mirrored", mirrored);
}

function setStatus(text, className = "") {
  dom.modelStatus.className = `system-status ${className}`.trim();
  dom.modelStatus.textContent = text;
}

function resizeCanvas() {
  const width = dom.cameraFeed.videoWidth || 1280;
  const height = dom.cameraFeed.videoHeight || 720;
  if (dom.poseCanvas.width !== width || dom.poseCanvas.height !== height) {
    dom.poseCanvas.width = width;
    dom.poseCanvas.height = height;
  }
}

function drawPose(pose) {
  const canvas = dom.poseCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose?.keypoints?.length) return;

  const points = Object.fromEntries(pose.keypoints.map((point) => [point.name, point]));
  ctx.lineWidth = Math.max(3, canvas.width / 300);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#32d296";
  ctx.fillStyle = "#fffdf8";

  EDGES.forEach(([start, end]) => {
    const a = point(points, start);
    const b = point(points, end);
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  pose.keypoints.forEach((keypoint) => {
    if ((keypoint.score || 0) < MIN_KEYPOINT_SCORE) return;
    ctx.beginPath();
    ctx.arc(keypoint.x, keypoint.y, Math.max(4, canvas.width / 220), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#16404d";
    ctx.lineWidth = Math.max(1.5, canvas.width / 900);
    ctx.stroke();
    ctx.strokeStyle = "#32d296";
    ctx.lineWidth = Math.max(3, canvas.width / 300);
  });
}

function point(points, name) {
  const item = points[name];
  if (!item || (item.score || 0) < MIN_KEYPOINT_SCORE) return null;
  return item;
}

function midpoint(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function distance(a, b) {
  if (!a || !b) return NaN;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angle(a, b, c) {
  if (!a || !b || !c) return NaN;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * 180 / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function lineAngle(a, b) {
  if (!a || !b) return NaN;
  let degrees = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);
  if (degrees > 90) degrees = 180 - degrees;
  return degrees;
}

function normalizedXOffset(a, b, width) {
  if (!a || !b || !Number.isFinite(width) || width <= 0) return NaN;
  return Math.abs(a.x - b.x) / width;
}

function getBounds(points) {
  if (!points.length) return { width: 1, height: 1, count: 0 };
  const xs = points.map((item) => item.x);
  const ys = points.map((item) => item.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    count: points.length
  };
}

function mean(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return NaN;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function scoreNear(value, target, perfect, zero) {
  if (!Number.isFinite(value)) return 0;
  const distanceFromTarget = Math.abs(value - target);
  if (distanceFromTarget <= perfect) return 1;
  if (distanceFromTarget >= zero) return 0;
  return 1 - ((distanceFromTarget - perfect) / (zero - perfect));
}

function scoreMin(value, perfect, zero) {
  if (!Number.isFinite(value)) return 0;
  if (value >= perfect) return 1;
  if (value <= zero) return 0;
  return (value - zero) / (perfect - zero);
}

function scoreMax(value, perfect, zero) {
  if (!Number.isFinite(value)) return 0;
  if (value <= perfect) return 1;
  if (value >= zero) return 0;
  return 1 - ((value - perfect) / (zero - perfect));
}

function scoreRange(value, min, max, soft) {
  if (!Number.isFinite(value)) return 0;
  if (value >= min && value <= max) return 1;
  if (value < min) return clamp((value - (min - soft)) / soft, 0, 1);
  return clamp(((max + soft) - value) / soft, 0, 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDegree(value) {
  return Number.isFinite(value) ? `${Math.round(value)} 度` : "--";
}

function formatRatio(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}
