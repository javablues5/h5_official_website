<template>
  <div class="container">
    <header
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      "
    >
      <img
        :src="logoState.imageUrl"
        alt="logo"
        style="height: 40px"
        @click="handleClick(logoState)"
      />
    </header>
    <div
      class="banner card"
      style="
        height: 168px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        margin-bottom: 18px;
        overflow: hidden;
      "
    >
      <!-- 广告图 -->
      <img
        :src="activeState.imageUrl"
        alt="logo"
        class="logo"
        style="width: 100%;  object-fit: cover; cursor: pointer"
        @click="handleClick(activeState)"
      />
    </div>

    <div class="tabs">
      <div
        class="tab"
        :class="{ active: active === 'pc28' }"
        @click="active = 'pc28'"
      >
        PC28
      </div>
      <div
        class="tab"
        :class="{ active: active === 'pcnn' }"
        @click="active = 'pcnn'"
      >
        PC牛牛
      </div>
      <div
        class="tab"
        :class="{ active: active === 'lhc' }"
        @click="active = 'lhc'"
      >
        六合彩
      </div>
    </div>

    <Pc28 v-if="active === 'pc28'" />
    <Pcnn v-else-if="active === 'pcnn'" />
    <Lhc v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import Pc28 from "./views/Pc28.vue";
import Pcnn from "./views/Pcnn.vue";
import Lhc from "./views/Lhc.vue";
const apiUrl = import.meta.env.VITE_API_BASES_URL;

const active = ref<"pc28" | "pcnn" | "lhc">("pc28");

type ApiItem = {
  openNewWindow: string; //新窗口打开 0=否,1=是
  isInner: string; //是否站内 0=否,1=是
  position: string; // 1=首页轮播,2=侧边栏
  imageUrl: string; //广告图
  linkUrl: string; //链接地址
};
//logo
const logoState = reactive({
  openNewWindow: "" as string | "",
  isInner: "" as string | "",
  position: "" as string | "",

  imageUrl: "" as string | "",
  linkUrl: "" as string | "",
});
//广告图
const activeState = reactive({
  openNewWindow: "" as string | "",
  isInner: "" as string | "",
  position: "" as string | "",

  imageUrl: "" as string | "",
  linkUrl: "" as string | "",
});

async function fetchMeta() {
  const resp = await fetch(
     "/official_website/app/adbanner/getActiveList"
  );
  const json = await resp.json();
  const list: ApiItem[] = (json?.data ?? []) as ApiItem[];
  if (!Array.isArray(list) || list.length === 0) return;

  list.forEach((item) => {
    switch (item.position) {
      case "home_banner": // 首页轮播
        Object.assign(logoState, item);
        break;
      case "product_list": // 侧边栏
        Object.assign(activeState, item);
        break;
      default:
        // 其他情况可以忽略或另外处理
        break;
    }
  });
}
function handleClick(item: ApiItem) {
  if (!item.linkUrl) return;

  // 站内跳转
  if (item.isInner === "1") {
    if (item.openNewWindow === "1") {
      // 新窗口打开站内
      window.open(item.linkUrl, "_blank");
    } else {
      // 当前窗口站内跳转（推荐用 vue-router）
      // 假设 linkUrl 是路由地址
      // router.push(item.linkUrl);
    }
  } else {
    // 站外跳转
    if (item.openNewWindow === "1") {
      window.open(item.linkUrl, "_blank"); // 新窗口站外
    } else {
      window.location.href = item.linkUrl; // 当前窗口站外
    }
  }
}

onMounted(() => {
  fetchMeta();
});
</script>

<style lang="scss" scoped>
.contaier{
  .logo{
    height: auto;
    width: 100%;
  }
}
</style>
