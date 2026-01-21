<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>YouTube Player</title>
  <style>
    body{margin:0;font-family:Arial,system-ui,-apple-system,Segoe UI,Roboto;background:#111;color:#fff;}
    .wrap{max-width:980px;margin:0 auto;padding:20px 14px;}
    .card{background:#1b1b1b;border-radius:12px;padding:14px;box-shadow:0 2px 14px rgba(0,0,0,.35);}
    .top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:12px}
    .meta{font-size:13px;color:#cfcfcf;word-break:break-all;line-height:1.35}
    .btns{display:flex;gap:8px;flex-wrap:wrap}
    .btn{padding:10px 12px;border:0;border-radius:8px;cursor:pointer;font-size:13px;color:#fff;background:#2a2a2a}
    .btn:hover{background:#333}
    .btn.warn{background:#3a2a2a}
    .btn.warn:hover{background:#4a2f2f}
    .player{position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;background:#000}
    #ytPlayer{position:absolute;inset:0;width:100%;height:100%}
    .err{margin-top:12px;color:#9bd0ff;font-size:14px}
    a{color:#9bd0ff}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div class="meta" id="meta">로딩중...</div>
        <div class="btns">
          <button class="btn warn" id="resetBtn">이어보기 초기화</button>
          <button class="btn" id="backBtn">← 메인으로</button>
        </div>
      </div>

      <div class="player" id="playerBox" style="display:none;">
        <div id="ytPlayer"></div>
      </div>

      <div class="err" id="err" style="display:none;"></div>
    </div>
  </div>

<script>
  function getInt(v, d=0) {
    const n = parseInt(v ?? "", 10);
    return Number.isFinite(n) ? n : d;
  }

  const params = new URLSearchParams(location.search);
  const videoId = params.get("v");           // 11자 ID
  const start = Math.max(0, getInt(params.get("start"), 0));
  const end = Math.max(0, getInt(params.get("end"), 0));
  const rel = params.get("rel") === "1" ? "1" : "0";

  const safeEnd = (end > start) ? end : 0;

  const $meta = document.getElementById("meta");
  const $err = document.getElementById("err");
  const $playerBox = document.getElementById("playerBox");

  document.getElementById("backBtn").addEventListener("click", () => {
    location.href = "/";
  });

  // 유효성 검사
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    $meta.textContent = "오류";
    $err.style.display = "block";
    $err.innerHTML = "영상 파라미터가 올바르지 않습니다. (v=영상ID 필요)";
    throw new Error("Invalid video id");
  }

  // ====== 이어보기 저장 키 ======
  const storageKey = `yt_resume_${videoId}`;
  function loadResume() {
    const v = Number(localStorage.getItem(storageKey) || "0");
    return Number.isFinite(v) ? v : 0;
  }
  function saveResume(sec) {
    if (!Number.isFinite(sec)) return;
    localStorage.setItem(storageKey, String(Math.max(0, Math.floor(sec))));
  }
  function clearResume() {
    localStorage.removeItem(storageKey);
  }

  document.getElementById("resetBtn").addEventListener("click", () => {
    clearResume();
    alert("이어보기 기록을 초기화했습니다.");
  });

  // ====== YouTube IFrame API 로드 ======
  // enablejsapi=1 없으면 currentTime을 가져올 수 없음
  const origin = location.origin;

  const embedParams = new URLSearchParams({
    autoplay: "1",
    rel: rel,
    start: String(start),
    enablejsapi: "1",
    origin: origin
  });
  if (safeEnd) embedParams.set("end", String(safeEnd));

  const resumeSaved = loadResume();
  // start보다 앞이면 start로, end 넘어가면 start로 보정
  let initialSeek = resumeSaved > 0 ? resumeSaved : start;
  if (initialSeek < start) initialSeek = start;
  if (safeEnd && initialSeek >= safeEnd - 2) initialSeek = start;

  $meta.textContent =
    `v=${videoId} / start=${start}s / end=${safeEnd ? safeEnd + "s" : "없음"} / rel=${rel}\n` +
    `이어보기: ${resumeSaved ? (initialSeek + "s부터 재생") : "없음"}`;

  // API 스크립트 삽입
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  let player = null;
  let lastSaved = 0;
  let savingTimer = null;

  function clampTime(t) {
    let x = Math.max(start, t || 0);
    if (safeEnd) x = Math.min(x, safeEnd - 0.3);
    return x;
  }

  // 일정 주기로 저장 (재생 중)
  function startSavingLoop() {
    stopSavingLoop();
    savingTimer = setInterval(() => {
      if (!player || typeof player.getCurrentTime !== "function") return;
      const t = clampTime(player.getCurrentTime());

      // 너무 자주 쓰지 않게 2초 이상 바뀔 때만 저장
      if (Math.abs(t - lastSaved) >= 2) {
        saveResume(t);
        lastSaved = t;
      }
    }, 1200);
  }

  function stopSavingLoop() {
    if (savingTimer) {
      clearInterval(savingTimer);
      savingTimer = null;
    }
  }

  // 창 닫거나 탭 숨길 때도 저장
  function saveNowBestEffort() {
    try {
      if (!player || typeof player.getCurrentTime !== "function") return;
      const t = clampTime(player.getCurrentTime());
      saveResume(t);
      lastSaved = t;
    } catch (e) {}
  }

  window.addEventListener("beforeunload", saveNowBestEffort);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveNowBestEffort();
  });

  // YouTube API 콜백
  window.onYouTubeIframeAPIReady = () => {
    $playerBox.style.display = "block";

    player = new YT.Player("ytPlayer", {
      videoId,
      playerVars: {
        autoplay: 1,
        rel: Number(rel),
        start: start,
        end: safeEnd || undefined,
        enablejsapi: 1,
        origin: origin
      },
      events: {
        onReady: (e) => {
          // 이어보기 위치로 이동
          const seekTo = clampTime(initialSeek);

          // 이미 start부터 로드되므로 seek는 약간 딜레이 후 안정적으로
          setTimeout(() => {
            try {
              player.seekTo(seekTo, true);
              // autoplay가 막히는 브라우저가 있어서 한번 더 play 시도
              player.playVideo();
            } catch (err) {}
          }, 250);

          startSavingLoop();
        },

        onStateChange: (e) => {
          // 1:재생, 2:일시정지, 0:종료, 3:버퍼링
          if (e.data === YT.PlayerState.PLAYING) {
            startSavingLoop();
          } else if (e.data === YT.PlayerState.PAUSED) {
            saveNowBestEffort();
          } else if (e.data === YT.PlayerState.ENDED) {
            // 끝까지 보면 이어보기 기록 삭제
            clearResume();
            stopSavingLoop();
          }
        },

        onError: (e) => {
          $err.style.display = "block";
          $err.innerHTML = "재생 오류가 발생했습니다. (이 영상은 임베드/재생 제한이 있을 수 있어요)";
          stopSavingLoop();
        }
      }
    });
  };
</script>
</body>
</html>
