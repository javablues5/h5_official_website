KKAA 国际开奖网 (Vue + Vite)

开发版将 `KKAA国际开奖网.html` 的页面工程化，拆分为组件：PC28 / PC牛牛 / 六合彩，并提供模拟数据与倒计时。

开发
```bash
# 在项目根目录执行
cd kkaa-vue
npm i
npm run dev
```
打开浏览器访问 http://localhost:5173

生产构建
```bash
npm run build
npm run preview
```

目录
- src/App.vue: 顶部 Logo、广告位、页签容器
- src/views/Pc28.vue: PC28 最新 + 历史表格
- src/views/Pcnn.vue: PC牛牛 最新 + 三列号码表格
- src/views/Lhc.vue: 六合彩 最新 + 历史表格
- src/styles.css: 基础样式，贴近原页面

对接真实接口
- 将各组件中的 `generate()` 替换为实际请求；填充 `latest` 与 `history`。
- 若使用服务端分页，可在页码改变时请求后端并更新 `history`。


