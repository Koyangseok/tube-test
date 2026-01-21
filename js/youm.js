<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>YouTube Player</title>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #000;
  height: 100%;
}
iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
</head>

<body>
<iframe id="player" allowfullscreen></iframe>

<script>
const params = new URLSearchParams(location.search);

const videoUrl = params.get("url");
const start = parseInt(params.get("start") || "0", 10);
const end = parseInt(params.get("end") || "0", 10);
const rel = params.get("rel") || "0";

if (!videoUrl) {
  document.body.innerHTML = "<p style='color:white'>영상 URL 없음</p>";
  throw new Error("No video URL");
}

let videoId = "";

if (videoUrl.includes("youtu.be")) {
  videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
} else {
  videoId = new URL(videoUrl).searchParams.get("v");
}

let src = `https://www.youtube.com/embed/${videoId}?rel=${rel}`;

if (start > 0) src += `&start=${start}`;
if (end > 0) src += `&end=${end}`;

document.getElementById("player").src = src;
</script>
</body>
</html>
