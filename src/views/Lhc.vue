<template>
  <div class="card" style="background-color: #f5f5f5">
    <div class="row" style="justify-content: center">
      <span>下一期:</span>
      <!-- 显示天（如果需要的话） -->
      <template v-if="timeLeft.days > 0">
        <span class="count">{{ timeLeft.days }}</span>
        <span>天</span>
      </template>

      <template v-if="timeLeft.hours > 0 || timeLeft.days > 0">
        <span class="count">{{ pad2(timeLeft.hours) }}</span>
        <span>时</span>
      </template>

      <span class="count">{{ pad2(timeLeft.minutes) }}</span>
      <span>分</span>
      <span class="count">{{ pad2(timeLeft.seconds) }}</span>
      <span>秒</span>
    </div>

    <div class="row" style="justify-content: center; margin-top: 8px">
      <span
        >最新
        <span class="count" style="background: #f3f4f6; color: #ef4444">{{
          latest.issue
        }}</span>
        期</span
      >
    </div>

    <div class="row" style="justify-content: center; margin-top: 8px">
      <div class="nums">
        <div
          v-for="(b, i) in latest.mains"
          :key="'m' + i"
          class="ball"
          :class="b.bs"
        >
          <div class="ball-no">{{ pad2(b.no) }}</div>
          <div class="ball-sx">{{ b.sx }}</div>
        </div>
        <div class="op" style="margin-bottom: 20px">+</div>
        <div class="ball special" :class="latest.special.bs">
          <div class="ball-no">{{ pad2(latest.special.no) }}</div>
          <div class="ball-sx">{{ latest.special.sx }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div
      style="
        justify-content: right;
        margin-top: 6px;
        display: flex;
        align-items: center;
        text-align: center;

        flex-wrap: wrap;
      "
    >
      <div
        v-for="y in years"
        :key="y"
        class="year-item"
        :class="{ active: y === selectedYear }"
        @click="selectYear(y)"
      >
        {{ y }}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr class="tr">
          <th>期号</th>
          <th>正码</th>
          <th>特码</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in history" :key="row.issue">
          <td>{{ row.issue }}</td>
          <td>
            <div class="balls-row">
              <div
                class="ball"
                :class="b.bs"
                v-for="(b, i) in row.mains"
                :key="'r' + row.issue + 'm' + i"
              >
                <div class="ball-no">{{ pad2(b.no) }}</div>
                <div class="ball-sx">{{ b.sx }}</div>
              </div>
            </div>
          </td>

          <td>
            <div class="ball special" :class="row.special.bs">
              <div class="ball-no">{{ pad2(row.special.no) }}</div>
              <div class="ball-sx">{{ row.special.sx }}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
type MetaResp = {
  code: number;
  data: {
    issue: number;
    lastIssue: number;
    beginTime: string;
    endTime: string;
    lotteryId: string;
    lotteryName: string;
    serverTime: string;
  };
};
type HistoryItem = {
  lotteryId: number;
  issue: number;
  noDetail: Record<
    string,
    { no: number; sx: string; bs: "red" | "blue" | "green" }
  >;
  openCode: string;
  openTime: string;
};

const state = reactive({
  deadline: Date.now(),
  now: Date.now(),
  nextTime: "",
  latest: {
    issue: "-",
    mains: [] as Array<{ no: number; sx: string; bs: string }>,
    special: { no: 0, sx: "", bs: "red" },
  },
  history: [] as Array<{
    issue: string;
    mains: Array<{ no: number; sx: string; bs: string }>;
    special: { no: number; sx: string; bs: string };
  }>,
});

const history = computed(() => state.history);
const latest = computed(() => state.latest);
onMounted(() => {
  fetchMeta();
  fetchHistory(new Date().getFullYear());
});

async function postJson(url: string, body: unknown) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function fetchMeta() {
  const resp = await fetch("/api/CurrentInfo?lotteryId=2034");
  const json = await resp.json();

  state.deadline = new Date(json?.data?.endTime).getTime() || Date.now();
}
// 当前选中的年份
const selectedYear = ref(new Date().getFullYear());

// 点击选择年份
function selectYear(y: number) {
  selectedYear.value = y;

  // 这里可以调用历史数据接口
  fetchHistory(y);
}

async function fetchHistory(year?: number) {
  const queryYear: number = year ?? new Date().getFullYear();
  const json = await postJson("/api/HistoryOpenInfo", {
    lotteryId: 2034,
    issueNum: queryYear,
  });
  const list: HistoryItem[] = json?.data ?? [];

  if (!Array.isArray(list) || list.length === 0) return;
  const latest = list[0];
  const order = latest.openCode.split(",");
  const detail = latest.noDetail;
  const mains = order.slice(0, 6).map((k) => detail[k]);
  const special = detail[order[6]];
  state.latest = { issue: String(latest.issue), mains, special };

  state.history = list.map((it) => {
    const seq = it.openCode.split(",");
    const d = it.noDetail;
    return {
      issue: String(it.issue).replace(String(year), "") + "期",
      mains: seq.slice(0, 6).map((k) => d[k]),
      special: d[seq[6]],
    };
  });
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function getTimeDiff(endTimeMs: number, nowMs: number) {
  let diff = Math.floor((endTimeMs - nowMs) / 1000); // 秒

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (24 * 3600));
  diff %= 24 * 3600;

  const hours = Math.floor(diff / 3600);
  diff %= 3600;

  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;

  return { days, hours, minutes, seconds };
}
const timeLeft = computed(() => getTimeDiff(state.deadline, state.now));

const years = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
});

let timer: number | null = null;

onMounted(() => {
  timer = setInterval(() => {
    state.now = Date.now();
  }, 1000) as unknown as number;
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
<style scoped>
.ball {
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.balls-row {
  display: flex;
  gap: 6px;
}

.ball-no {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
}
.ball.red .ball-no {
  background: #ef4444;
}
.ball.blue .ball-no {
  background: #3b82f6;
}
.ball.green .ball-no {
  background: #10b981;
}
.ball.special .ball-no {
  background: #f59e0b;
}
.ball-sx {
  font-size: 12px;
  color: #374151;
}
.year-item {
  margin: 0 4px;
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.year-item:hover {
  background: #f2f2f2;
}

.year-item.active {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
  font-weight: bold;
}
</style>
