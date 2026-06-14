# 网页端（HTML5）发布说明

> 面向真实发布场景：从本地调通到正式部署。覆盖启动方式、资源路径、音频触发、缓存刷新，以及一份固定的报错排查顺序。
>
> **本文是 Lime HTML5 发布的权威说明。** 根 `README.md` 只列出 `lime test html5` 这一条命令；`templates/html5/` 下的模板文件只是生成产物用的素材，不要把它们当文档读。网上不少旧资料（"双击 index.html 就能跑"、"用 appcache 做缓存"、"资源用绝对路径")已经过时或会误导，本文末尾统一纠正。

---

## 1. 总览：两套发布方式

Lime 的 HTML5 目标有两套产物形态，**先选一套**，全程别混用：

| | 方式 A：直接模板 | 方式 B：npm + webpack |
|---|---|---|
| 触发 | `lime build/test html5` | `lime build/test html5 -npm` |
| 产物 | 一个文件夹，直接就是可部署站点 | 一个 webpack 工程，构建后站点在 `dist/` |
| 打包器 | Lime 自带（可选 Closure/terser 压缩） | webpack（haxe-loader 编译 Haxe） |
| 适合 | 绝大多数项目、想开箱即用 | 已有前端工程、需要自定义打包/接入现有构建链 |

两种方式的**运行时行为完全一致**（同一套 `lime.embed` 启动、同一套资源/音频/缓存机制），区别只在"谁来打包、产物放哪"。下面分别说。

---

## 2. 方式 A：直接模板

### 2.1 构建

```bash
lime build html5            # 仅编译，不启动
lime test  html5            # 编译 + 启动本地服务器 + 打开浏览器
lime test  html5 -debug     # 调试构建（带 .js.map，便于断点）
lime build html5 -final     # 发布构建（默认会做 JS 压缩）
```

产物目录（默认 `bin/html5/bin/`，实际取决于项目 `<app path>`）大致如下：

```
bin/html5/bin/
├── index.html              # 入口页（由 templates/html5/template/index.html 生成）
├── <App>.js                # 你的应用主脚本（<App> = project.xml 里的 <app file>）
├── <App>.js.map            # 仅 -debug 构建会有
├── manifest/
│   └── <library>.json      # 资源清单（默认库通常叫 default.json）
└── assets/ ...             # 实际的图片/音频/字体等资源文件
```

> **要点：部署时把这个文件夹整体一起传。** `index.html`、`<App>.js`、`manifest/`、`assets/` 是一套，缺一不可，且它们之间是相对路径关系（见第 4 节）。

### 2.2 本地怎么跑起来

**不要双击 `index.html`（`file://`）。** 页面本身能打开，但应用启动后会用 `XMLHttpRequest`/`fetch` 去读 `manifest/<library>.json` 和资源文件，浏览器在 `file://` 协议下会以安全策略拦截这些请求 —— 表现为白屏或控制台一堆 `Cross origin requests are only supported for...` / 资源加载失败。

正确做法是走 HTTP。最省事的就是：

```bash
lime test html5
```

它会启动 Lime 自带的 Node 静态服务器（来自 `templates/bin/node/http-server`），并自动开浏览器。这个服务器的默认参数（见 `src/lime/tools/HTML5Helper.hx`）是：

- `-c-1` —— **禁用缓存**（开发期改了代码刷新就生效，不会吃旧缓存）；
- `--cors` —— 允许跨域；
- 端口从 `3000` 起自动找空闲端口（`http://localhost:3000`、`3001`…）。

常用调整：

```bash
lime test html5 -port 8080   # 指定端口
lime test html5 -nolaunch    # 不自动打开浏览器
```

也可以用任何你习惯的静态服务器对着产物目录起服务，例如：

```bash
cd bin/html5/bin
python -m http.server 8080
# 或 npx http-server -c-1 --cors .
```

### 2.3 启动原理（对照 index.html）

生成出来的 `index.html` 关键部分长这样（已填入真实值并加注释）：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My Game</title>
  <meta id="viewport" name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="mobile-web-app-capable" content="yes">

  <!-- ① 相对路径加载主脚本。注意是 "./"，不是 "/My Game.js"。 -->
  <script type="text/javascript" src="./My Game.js"></script>
</head>
<body>
  <!-- ② 应用会被注入到这个容器里 -->
  <div id="content"></div>

  <!-- ③ 启动：项目名、容器 id、宽、高 -->
  <script type="text/javascript">
    lime.embed("My Game", "content", 800, 600);
  </script>
</body>
</html>
```

- 全局 `lime.embed(...)` 由 `<App>.js` 顶部的包装代码定义（源自 `templates/html5/output.js`）。
- 因为脚本用的是相对路径 `./`，所以整个产物文件夹放到任意子目录都能跑（详见第 4 节）。
- 模板源文件在 `templates/html5/template/index.html`，里面是 `::APP_FILE::` 这类占位符，由构建时替换 —— **不要直接编辑产物里的 `index.html`**（下次构建会被覆盖）；要改入口页，改模板或在 `project.xml` 里配置。

---

## 3. 方式 B：npm + webpack

加 `-npm` 即切换到 webpack 工程形态：

```bash
lime test  html5 -npm        # 首次会自动 npm install，然后起 webpack-dev-server 并打开浏览器
lime build html5 -npm        # webpack 开发构建（等价 npm run build:dev）
lime build html5 -npm -final # webpack 生产构建（等价 npm run build:prod，带 UglifyJS 压缩）
```

机制（见 `tools/platforms/HTML5Platform.hx`）：Lime 把 `templates/html5/npm` 拷到 `bin/html5/bin/`，没有 `node_modules` 时自动 `npm install`，再调用对应 npm script。生成的工程结构：

```
bin/html5/bin/
├── package.json            # scripts: start / build:dev / build:prod ...
├── webpack.common.js       # entry=hxml，输出到 dist/，library=lime / libraryTarget=window
├── webpack.dev.js          # 开发：devServer + inline-source-map
├── webpack.prod.js         # 生产：UglifyJS + source-map
├── haxe/ <App>.js ...      # haxe-loader 用的入口与素材
└── dist/                   # ← 最终可部署站点在这里（index.html、打包后的 JS、资源）
```

也可以进目录直接用 npm：

```bash
cd bin/html5/bin
npm install
npm start            # = start:dev，webpack-dev-server --open
npm run build        # = build:prod，产物进 dist/
```

> **两个容易踩的点（webpack 模板自带，不是你配错了）：**
> 1. 模板用的是 **webpack 4**，dev server 配置里是旧版 API `contentBase`（webpack-dev-server 3）。若你把 webpack 升到 5，需要自行把 `contentBase` 改成 `static`，否则 dev server 起不来。
> 2. `package.json` 里 `devDependencies.haxe` 是 `^5.0.10`，而 `haxeDependencies.haxe` 是 `3.4.7` —— 前者是 npm 包，后者才是 **haxe-loader 实际用来编译的 Haxe 编译器版本**。两者不一致是正常的，别把它当成版本冲突去"修"。

**部署时只传 `dist/`**（不是整个 `bin/`，`node_modules`/源码都不需要上线）。

---

## 4. 资源引用与部署路径（核心）

这是"子目录 / CDN"问题的根源。先理解机制，再看三种部署形态。

### 4.1 资源是怎么定位的

运行时按资源清单（manifest）里的 `rootPath` 拼出每个资源的 URL：

```
最终 URL = rootPath（非空则补 "/"）+ 资源在清单里的相对路径
```

（实现见 `src/lime/utils/AssetLibrary.hx` 第 820 行附近：`basePath = manifest.rootPath`。）

构建时，Lime 把默认库的清单放在 `manifest/<library>.json`，并给它设 `rootPath = "../"`（见 `src/lime/tools/AssetHelper.hx:601`）。于是：清单在 `manifest/` 子目录里，`../` 把基准退回产物根目录，资源就从根目录下的 `assets/...` 解析。**全程没有任何绝对路径、没有写死域名。**

### 4.2 三种部署形态

**① 部署到网站根目录** —— 直接传产物文件夹内容到根，打开 `https://example.com/` 即可，无需任何改动。

**② 部署到子目录（如 `https://example.com/game/`）** —— 把整个产物文件夹放进 `/game/`，打开 `https://example.com/game/` 即可，**同样不用改任何配置**。因为 `index.html` 用 `./<App>.js`、清单用 `../` 都是相对的，整体平移不受影响。

> 反例（常见踩坑）：有人手动把 `index.html` 里的脚本改成绝对路径 `/My Game.js`，在根目录能跑，一放进 `/game/` 子目录就 404。**保持相对路径**就不会有这个问题。

**③ 资源放到独立 CDN / 另一个域名** —— 这时需要给资源加一个指向 CDN 的前缀。两种做法：

- **推荐：运行时加载带 `rootPath` 的库。** 把资源 + 清单上传到 CDN，应用启动时手动加载并注册（API 见 `lime.utils.AssetLibrary` / `lime.utils.Assets`，均已存在）：

  ```haxe
  import lime.utils.AssetLibrary;
  import lime.utils.Assets;

  // 把清单和资源放在 https://cdn.example.com/game/ 下，
  // 清单文件为 https://cdn.example.com/game/manifest/default.json
  AssetLibrary.loadFromFile("https://cdn.example.com/game/manifest/default.json")
    .onComplete(function(library) {
      Assets.registerLibrary("default", library);
      // 之后 Assets.getBitmapData("img/logo.png") 等照常用，URL 会带上 CDN 前缀
    });
  ```

  `loadFromFile(path)` 会自动以清单所在目录为 `rootPath`；要显式指定前缀，传第二个参数：`AssetLibrary.loadFromFile(path, "https://cdn.example.com/game")`。

- 或在构建/打包阶段把资源同步到 CDN，并据此设置清单的 `rootPath`（直接方式下需自行处理同步，本质同上）。

> **CDN 必须配 CORS。** 跨域取资源（XHR/fetch）会被浏览器拦，CDN 上要返回 `Access-Control-Allow-Origin`，否则控制台报 CORS 错、资源加载失败。

---

## 5. 音频：为什么手机第一次进来没声音

**这不是 bug，是浏览器的自动播放策略。** 移动端（以及现代桌面浏览器）禁止页面在用户交互之前播放有声音频。

Lime 的 HTML5 音频走 Web Audio / Howler（见 `src/lime/media/howlerjs/Howler.hx`）。Howler 会在**第一次用户手势**时自动解锁音频上下文。所以症结永远是同一个：**第一次播放/恢复声音，必须发生在一次真实用户手势（点击、触摸）里。**

实践要点：

- 不要在 `Application` 一启动、还没任何交互时就 `play()` 背景音乐 —— 会被静音丢弃。
- 在第一个输入事件里启动音频（之后就一直能响了）。在 Lime 里重写 `onMouseDown` / `onTouchEnd` 即可：

```haxe
import lime.app.Application;
import lime.media.AudioSource;
import lime.utils.Assets;

class Main extends Application {
  var music:AudioSource;
  var audioStarted = false;

  public function new() {
    super();
    // 只是先把音频数据准备好，并不播放
    music = new AudioSource(Assets.getAudioBuffer("audio/bgm.ogg"));
    music.loops = -1; // 循环
  }

  // 鼠标按下 / 触摸结束都算一次用户手势
  override public function onMouseDown(x:Float, y:Float, button:lime.ui.MouseButton):Void {
    startAudioOnce();
  }
  override public function onTouchEnd(touch:lime.ui.Touch):Void {
    startAudioOnce();
  }

  function startAudioOnce():Void {
    if (audioStarted) return;
    audioStarted = true;
    music.play(); // ← 关键：第一次播放在用户手势内
  }
}
```

> 如果你的游戏本来就有"点击开始"按钮，把首次播放挂在那个按钮上是最自然的解法 —— 用户点了"开始"，音频也就解锁了。

---

## 6. 缓存与刷新：为什么更新版本后还是旧的

**先纠正一个常见误解：Lime 不会为 HTML5 生成任何缓存破坏机制** —— 没有 Service Worker、没有 appcache、文件名也不带内容哈希。是否吃缓存、缓存多久，**完全由你的服务器/CDN 的 HTTP 响应头决定**。（appcache 这个老技术已被所有主流浏览器移除，别再去找它。）

分场景：

- **开发期**：`lime test html5` 的自带服务器已用 `-c-1` 禁缓存，改完刷新就生效。如果你换了别的本地服务器又遇到不更新，给它也加上禁缓存（如 `npx http-server -c-1`）。

- **生产部署**：核心策略是 **入口 HTML 不缓存、带版本的静态资源长缓存**：
  - 给 `index.html` 设 `Cache-Control: no-cache`（或很短的 max-age）—— 保证用户每次都能拿到指向新资源的最新入口。
  - 给 `<App>.js`、`assets/*` 这类静态文件，要么文件名带版本/哈希再设 `Cache-Control: max-age=31536000, immutable`；要么干脆也走 `no-cache`。

  Nginx 示例：

  ```nginx
  location = /index.html { add_header Cache-Control "no-cache"; }
  location ~* \.(js|png|ogg|mp3|woff2)$ { add_header Cache-Control "no-cache"; }
  ```

- **没法改服务器头时的兜底**：发布新版本时给主脚本/资源加一个版本查询串或改文件名，让 URL 变化从而绕过缓存。例如把入口改成 `./My Game.js?v=20240601`（URL 一变，浏览器就当成新文件重新拉）。

> 注意：靠 `<meta http-equiv="Cache-Control">` 写在 HTML 里**并不可靠**，不同浏览器/CDN 行为不一致。要控缓存，请在服务器/CDN 侧配响应头。`Ctrl+F5` 强刷只对你自己调试有用，解决不了线上用户的缓存。

---

## 7. 最小可对照示例：从本地到部署

把上面几节串成一条最短路径，照着走一遍：

```bash
# 1) 本地调通
lime test html5                 # 自带服务器(-c-1 --cors)起来并打开浏览器，确认能跑、有声音

# 2) 出发布构建
lime build html5 -final         # 产物在 bin/html5/bin/（已压缩）

# 3) 部署（任选其一）
#  - 根目录：把 bin/html5/bin/ 内容传到站点根
#  - 子目录：把 bin/html5/bin/ 整个放进 /game/，访问 /game/ 即可（无需改配置）

# 4) 配缓存头：index.html 设 no-cache；带版本的静态资源长缓存
```

应用侧最容易卡住的两件事，对照前文：

- **没声音** → 首次 `play()` 必须在用户手势里（第 5 节示例）。
- **子目录/CDN 路径** → 保持相对路径；CDN 用 `AssetLibrary.loadFromFile(url[, rootPath])` 并配 CORS（第 4 节示例）。

---

## 8. 常见报错与排查顺序

遇到问题别瞎试，按这个固定顺序走，基本一两步就能定位：

1. **是不是没起服务器？** 直接双击 `file://` 打开的，一定先改用 `lime test html5` 或任意静态服务器。
2. **打开浏览器 DevTools 的 Network 面板，看红色的失败请求。**
   - `<App>.js` 404 → 入口脚本路径不对（多半是被改成了绝对路径，或子目录里漏了文件）。
   - `manifest/*.json` 或 `assets/*` 404 → 资源没和入口一起部署，或 `rootPath`/子目录路径不对。
   - 资源请求报 **CORS** 错 → 资源在另一个域（CDN）但没配 `Access-Control-Allow-Origin`。
3. **再看 Console 面板的报错文本**，对照上面的 404/CORS 判断是"路径问题"还是"没起服务"。
4. **改了代码不生效** → 缓存。开发期确认服务器带 `-c-1`；线上确认 `index.html` 是 `no-cache`，或给资源加版本串；`Ctrl+F5` 仅供自测。
5. **没声音** → 检查首次播放是否在用户手势（`onMouseDown`/`onTouchEnd`/按钮点击）里触发。
6. **字体不显示** → 字体走 CSS `@font-face`，构建时模板会在页面里放一个隐藏 `<span>` 触发加载；确认该字体资源已部署、清单里有它。

一句话顺序：**先确认起了 HTTP 服务 → Network 看 404/CORS → Console 看报错 → 查路径前缀 → 查缓存头 → 查音频手势。**

---

## 9. 与现有文档/模板的关系（统一说明）

- **本文是权威来源。** 关于 HTML5 发布的问题，以本文为准。
- 根 `README.md` 只负责列出 `lime test html5` 属于支持的目标，细节指向本文。
- `templates/html5/`（`template/index.html`、`output.js`、`npm/*`）和 `tools/platforms/HTML5Platform.hx` 是产物生成/构建逻辑的**实现参考**，不是面向使用者的说明；本文中引用它们只为说明机制。
- 明确作废以下常见误导说法：
  - ❌ "双击 index.html 就能跑" —— `file://` 下资源加载会被拦，必须走 HTTP。
  - ❌ "资源/脚本用绝对路径 `/App.js`" —— 子目录部署会 404，应保持相对路径。
  - ❌ "用 appcache / manifest 做离线缓存" —— 已被浏览器移除；缓存用 HTTP 头控制。
  - ❌ "靠 `<meta http-equiv>` 控缓存" —— 不可靠，请配服务器/CDN 响应头。
