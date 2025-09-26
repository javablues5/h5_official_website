<template>
  <div class="card" style="background-color: #f5f5f5">
    <!-- 下一期倒计时 -->
    <div class="row" style="justify-content: center" v-if="timeLeft.total > 0">
      <span>下一期:</span>
      <span class="count">{{ timeLeft.minutes }}</span>
      <span>分</span>
      <span class="count">{{ timeLeft.seconds }}</span>
      <span>秒</span>
    </div>

    <!-- 最新期号 -->
    <div class="row" style="justify-content: center; margin-top: 10px">
      <span>
        最新
        <span class="count" style="background: #f3f4f6; color: #ef4444">
          {{ latest.issue }}
        </span>
        期
      </span>
    </div>

    <!-- 最新开奖号码 -->
    <div class="row" style="justify-content: center; margin-top: 8px">
      <div class="nums">
        <div class="num">{{ latest.numbers[0] }}</div>
        <div class="op">+</div>
        <div class="num">{{ latest.numbers[1] }}</div>
        <div class="op">+</div>
        <div class="num">{{ latest.numbers[2] }}</div>
        <div class="op">=</div>
        <div class="sum">{{ latest.sum }}</div>
        <span class="tag red">{{ latest.size }}</span>
        <span class="tag blue">{{ latest.oddEven }}</span>
      </div>
    </div>

    <div class="row" style="justify-content: center; margin-bottom: 12px">
      <button class="pager" @click="openScratch">咪牌模式</button>
    </div>
  </div>
  <div class="card">
    <table class="table">
      <thead>
        <tr>
          <th>期号</th>
          <th>号码一</th>
          <th>号码二</th>
          <th>号码三</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in history" :key="row.issue">
          <td>{{ row.issue }}</td>
          <td>
            <span class="chip" :class="colorClass(row.v1)">{{
              toNiu(row.v1)
            }}</span>
          </td>
          <td>
            <span class="chip" :class="colorClass(row.v2)">{{
              toNiu(row.v2)
            }}</span>
          </td>
          <td>
            <span class="chip" :class="colorClass(row.v3)">{{
              toNiu(row.v3)
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      style="
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 12px;
      "
    ></div>
  </div>

  <!-- 弹窗刮刮卡 -->
  <div v-if="showScratch" class="overlay">
    <div class="scratch-box">
      <!-- 倒计时 -->
      <div class="countdown">
        下一期：
        <span class="count">{{ timeLeft.minutes }}</span> 分
        <span class="count">{{ timeLeft.seconds }}</span> 秒
      </div>

      <!-- 期号 -->
      <div class="issue">
        第 <span class="highlight">{{ latest.issue }}</span
        >期开奖结果
      </div>

      <!-- 刮刮卡区域 -->
      <div
        ref="scratchContainer"
        class="scratch-container"
        style="
          position: relative;
          width: 300px;
          height: 100px;
          background-color: #fff;
        "
      >
        <!-- 白底 + 数字 DOM -->
        <div
          class="scratch-content"
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 44px;
            color: #ef4444;
            font-weight: bold;
          "
        >
          {{ latest.numbers[0] }} + {{ latest.numbers[1] }} +
          {{ latest.numbers[2] }} = {{ latest.sum }}
        </div>

        <!-- canvas 灰色遮罩 -->
        <canvas
          ref="maskCanvas"
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          "
        ></canvas>
      </div>

      <!-- 按钮 -->
      <div
        class="actions"
        style="
          margin-top: 10px;
          display: flex;
          gap: 10px;
          justify-content: center;
        "
      >
        <button
          @click="resetScratch"
          style="
            background-color: #fffc00;
            border: none;
            padding: 8px 16px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          刷新
        </button>
        <button
          @click="closeScratch"
          style="
            background-color: #eee;
            border: none;
            padding: 8px 16px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted, onUnmounted } from "vue";
const pcUrl = import.meta.env.VITE_PC_BASE_URL;

type ApiItem = {
  qihao: number;
  term: number;
  nextDrawTime: number;
  drawTime: number;
  first: number;
  second: number;
  third: number;
  drawDate: string;
};

const state = reactive({
  deadline: Date.now(),
  now: Date.now(),
  latest: {
    issue: "-",
    numbers: [0, 0, 0] as [number, number, number],
    sum: 0,
    size: "-",
    oddEven: "-",
  },
  history: [] as Array<{
    issue: string;
    time: string;
    v1: number;
    v2: number;
    v3: number;
  }>,
  page: 1,
  pageSize: 10,
});

const timeLeft = computed(() => {
  const ms = Math.max(0, state.deadline - state.now);
  const total = Math.floor(ms / 1000);

  const minutes = Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return { total, minutes, seconds };
});

// 展示全部返回数据，不做分页
const history = computed(() => state.history);

let poller: any;
let tickTimer: any;
onMounted(() => {
  fetchHistory();
  // 进入页面开启 1 秒轮询
  poller = setInterval(fetchHistory, 1000);
  tickTimer = setInterval(() => (state.now = Date.now()), 1000);
});
onUnmounted(() => {
  clearInterval(poller);
  clearInterval(tickTimer);
});

const showScratch = ref(false);

const scratchContainer = ref<HTMLDivElement | null>(null);
const maskCanvas = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;

// 初始化 canvas 遮罩
function initCanvas() {
  if (!maskCanvas.value || !scratchContainer.value) return;
  const canvas = maskCanvas.value;
  canvas.width = scratchContainer.value.clientWidth;
  canvas.height = scratchContainer.value.clientHeight;

  ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#555555"; // 深灰色
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 鼠标 / 触摸事件
function startDraw(e: MouseEvent | TouchEvent) {
  isDrawing = true;
  draw(e);
}
function endDraw() {
  isDrawing = false;
}
function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing || !ctx || !maskCanvas.value) return;

  let clientX: number, clientY: number;
  if (e instanceof MouseEvent) {
    clientX = e.offsetX;
    clientY = e.offsetY;
  } else {
    const rect = maskCanvas.value.getBoundingClientRect();
    clientX = e.touches[0].clientX - rect.left;
    clientY = e.touches[0].clientY - rect.top;
  }

  const radius = 20;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(clientX, clientY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
  ctx.globalCompositeOperation = "source-over";

  checkClear();
}

// 检查刮开比例
function checkClear() {
  if (!ctx || !maskCanvas.value) return;
  const imageData = ctx.getImageData(
    0,
    0,
    maskCanvas.value.width,
    maskCanvas.value.height
  );
  let count = 0;
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] === 0) count++;
  }
  const percent =
    (count / (maskCanvas.value.width * maskCanvas.value.height)) * 100;
  if (percent > 50) {
    console.log("刮开完成！");
    // 这里可以触发动画或其他逻辑
  }
}

function openScratch() {
  showScratch.value = true;
  nextTick(() => {
    initCanvas();

    if (!maskCanvas.value) return;

    // 鼠标事件
    maskCanvas.value.addEventListener("mousedown", startDraw);
    maskCanvas.value.addEventListener("mouseup", endDraw);
    maskCanvas.value.addEventListener("mouseleave", endDraw);
    maskCanvas.value.addEventListener("mousemove", draw);

    // 触摸事件
    maskCanvas.value.addEventListener("touchstart", startDraw);
    maskCanvas.value.addEventListener("touchend", endDraw);
    maskCanvas.value.addEventListener("touchmove", draw);
  });
}

function resetScratch() {
  initCanvas();
}

function closeScratch() {
  showScratch.value = false;
}

async function fetchHistory() {
  const resp = await fetch(pcUrl + "/open/history?game=Canadian");
  const json = await resp.json();
  const list: ApiItem[] = (json?.data ?? []) as ApiItem[];
  if (!Array.isArray(list) || list.length === 0) return;

  // 最新期（最后一条）→ 顶部“最新/下一期”展示
  const latestRaw = list[list.length - 1];
  const a = latestRaw.first,
    b = latestRaw.second,
    c = latestRaw.third;
  const s = a + b + c;
  const size = s >= 14 ? "大" : "小";
  const oe = s % 2 === 0 ? "双" : "单";
  state.latest = {
    issue: String(latestRaw.qihao ?? latestRaw.term),
    numbers: [a, b, c],
    sum: s,
    size,
    oddEven: oe,
  };
  state.deadline = latestRaw.nextDrawTime || latestRaw.drawTime + 3 * 60 * 1000;

  // 其余全部显示在列表中（倒序，最新在前），值取 0-9 用作“牛”映射
  state.history = list
    .slice(0, Math.max(0, list.length - 1))
    .map((it) => ({
      issue: String(it.qihao ?? it.term),
      time:
        it.drawDate?.slice(11, 19) ||
        new Date(it.drawTime).toTimeString().slice(0, 8),
      v1: it.first % 10,
      v2: it.second % 10,
      v3: it.third % 10,
    }))
    .reverse();
}

function toNiu(n: number) {
  // 0 映射为 牛十；1-9 映射 牛一~牛九
  const map = [
    "牛十",
    "牛一",
    "牛二",
    "牛三",
    "牛四",
    "牛五",
    "牛六",
    "牛七",
    "牛八",
    "牛九",
  ];
  return map[n % 10];
}

function colorClass(n: number) {
  // 文案与颜色对照：1=黑，2-5=绿，6-9=蓝，0(牛十)=红
  if (n === 1) return "dark";
  if (n === 0) return "red";
  if (n >= 2 && n <= 5) return "teal";
  return "blue";
}

function noop() {}

const latest = computed(() => state.latest);
</script>
