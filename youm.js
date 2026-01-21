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
    .meta{font-size:13px;color:#cfcfcf;word-break:break-all}
    .btn{padding:10px 12px;border:0;border-radius:8px;cursor:pointer;font-size:13px;color:#fff;background:#2a2a2a}
    .btn:hover{background:#333}
    .player{position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;background:#000}
    iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    .err{margin-top:12px;color:#9bd0ff;font-size:14px}
    a{color:#9bd0ff}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div class="meta" id="meta">로딩중...</div>
        <button class="btn" id="backBtn">← 메인으로</button>
      </div>

      <div class="player" id="playerBox" style="display:none;">
        <iframe id="ytFrame" allowfullscreen></iframe>
      </div>

      <div class="err" id="err" style="display:none;"></div>
    </div>
  </div>

<script>
  function getInt(v, d=0) {
    const n = parseInt(v ?? "", 10);
    return Number.isFinite(n) ? n : d;
  }

  // index.html에서 v(영상ID)로 넘기는 방식 사용
  const params = new URLSearchParams(location.search);

  const videoId = params.get("v");           // 11자 ID
  const start = Math.max(0, getInt(params.get("start"), 0));
  const end = Math.max(0, getInt(params.get("end"), 0));
  const rel = params.get("rel") === "1" ? "1" : "0";

  const $meta = document.getElementById("meta");
  const $err = document.getElementById("err");
  const $playerBox = document.getElementById("playerBox");
  const $frame = document.getElementById("ytFrame");

  document.getElementById("backBtn").addEventListener("click", () => {
    // 같은 도메인 루트로 이동
    location.href = "/";
  });

  // 유효성 검사
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    $meta.textContent = "오류";
    $err.style.display = "block";
    $err.innerHTML = '영상 파라미터가 올바르지 않습니다. 메인으로 돌아가서 다시 생성해주세요. (v=영상ID 필요)';
    throw new Error("Invalid video id");
  }

  // end가 start보다 작으면 무시
  const safeEnd = (end > start) ? end : 0;

  // embed URL 생성
  const embedParams = new URLSearchParams({
    autoplay: "1",
    rel: rel,
    start: String(start),
    // end는 0이면 넣지 않는 게 안전
  });
  if (safeEnd) embedParams.set("end", String(safeEnd));

  const src = `https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`;

  $meta.textContent = `v=${videoId} / start=${start}s / end=${safeEnd ? safeEnd + "s" : "없음"} / rel=${rel}`;
  $frame.src = src;
  $playerBox.style.display = "block";
</script>
</body>
</html>
