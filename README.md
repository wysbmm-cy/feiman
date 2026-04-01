# Anything Feynman

**版本**: 1.0.0

一款基于费曼学习法的 AI 学习软件，通过"以教促学"的方式帮助你深度理解知识。

## ✨ 核心特性

### 🎓 费曼学习工作流
- **康奈尔笔记**：结构化的三区域笔记格式（笔记栏、线索栏、总结栏）
- **六阶段学习**：学习 → 解释 → 苏格拉底 → 评估 → 精炼 → 验证
- **双 AI 模式**：学生 AI 提问，专家 AI 评估

### 💻 编程学习模式
支持多种编程语言的专项学习模式：

| 语言 | 图标 | 特性 |
|------|------|------|
| C/C++ | ⚡ | 内存管理、指针语义、模板元编程 |
| Python | 🐍 | 装饰器、生成器、异步编程 |
| Java | ☕ | JVM 原理、并发编程、设计模式 |
| JavaScript | 🌐 | 原型链、闭包、事件循环 |

每种语言都有专门的学生 AI 人格配置和常见误解库。

### 📊 知识图谱
- 自动关联知识点
- 可视化知识结构
- 发现概念间的联系

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

---

## 📦 打包发布指南

### 目录结构
```
feiman/
├── build/              # 打包资源目录
│   ├── icon.ico        # Windows 图标 (已配置)
│   ├── icon.icns       # macOS 图标 (已配置)
│   └── icon.png        # Linux 图标 (已配置)
├── resources/          # 应用资源目录
├── out/                # 构建输出 (git ignored)
└── dist/               # 打包输出 (git ignored)
```

### Windows 打包 (生成 installer.exe)

#### 方法一：在 Windows 系统上打包
```bash
# 1. 安装依赖
pnpm install

# 2. 构建并打包
pnpm package:win
```

打包完成后，在 `dist/` 目录下会生成：
- `Anything Feynman Setup 1.0.0.exe` - NSIS 安装程序
- `Anything Feynman-1.0.0-win.exe` - 便携版（如果配置）

#### 方法二：在 Linux/macOS 上交叉编译 Windows 版本
```bash
# 安装 Wine (可选，用于某些情况)
# sudo apt install wine64

# 交叉编译
pnpm package:win
```

> **注意**：交叉编译可能遇到签名问题，建议在 Windows 系统上进行最终打包。

#### 方法三：使用 GitHub Actions 自动构建
创建 `.github/workflows/build.yml`：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build and package
        run: pnpm package:win
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: dist/*.exe
```

### macOS 打包
```bash
pnpm package:mac
```

输出：
- `Anything Feynman-1.0.0.dmg` - DMG 安装镜像
- `Anything Feynman-1.0.0-mac.zip` - ZIP 压缩包

> **注意**：macOS 应用需要 Apple Developer 证书签名才能在其他 Mac 上运行。

### Linux 打包
```bash
pnpm package:linux
```

输出：
- `Anything Feynman-1.0.0.AppImage` - 通用 Linux 格式
- `Anything Feynman_1.0.0_amd64.deb` - Debian/Ubuntu 包

### 打包所有平台
```bash
pnpm package
```

---

## ⚙️ 打包配置详解

### package.json 中的 electron-builder 配置

```json
{
  "build": {
    "appId": "com.feiman.app",
    "productName": "Anything Feynman",
    "copyright": "Copyright © 2024 wysbmm-cy, Aurolystant",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    },
    "files": [
      "out/**/*",
      "package.json"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Anything Feynman"
    }
  }
}
```

### NSIS 安装程序选项

| 选项 | 说明 |
|------|------|
| `oneClick: false` | 非一键安装，显示安装向导 |
| `allowToChangeInstallationDirectory` | 允许用户选择安装目录 |
| `createDesktopShortcut` | 创建桌面快捷方式 |
| `createStartMenuShortcut` | 创建开始菜单快捷方式 |
| `shortcutName` | 快捷方式名称 |

### 自定义安装程序

如需自定义安装界面，可添加：
```json
{
  "nsis": {
    "installerIcon": "build/installer.ico",
    "uninstallerIcon": "build/uninstaller.ico",
    "installerHeaderIcon": "build/header.ico",
    "installerSidebar": "build/sidebar.bmp",
    "license": "LICENSE",
    "include": "build/installer.nsh"
  }
}
```

---

## 🔧 常见问题

### Q: Windows 打包时报错 "Cannot create symbolic link"
这是 Windows 权限问题。electron-builder 的代码签名工具包含符号链接，普通用户无权创建。

**解决方案（三选一）**：

#### 方案 1：禁用代码签名（推荐，已在项目中配置）
项目已在 `package.json` 中配置 `win.sign: false`，跳过代码签名：
```json
{
  "win": {
    "sign": false
  }
}
```

#### 方案 2：以管理员身份运行
```powershell
# 右键点击 PowerShell → 以管理员身份运行
cd C:\Users\你的用户名\Downloads\feimann\projects
pnpm package:win
```

#### 方案 3：启用 Windows 开发者模式
1. 打开「设置」→「隐私和安全性」→「开发者选项」
2. 开启「开发者模式」
3. 重启电脑后再次尝试打包

> **注意**：未签名的应用在运行时可能触发 Windows SmartScreen 警告，点击「仍要运行」即可。

### Q: 打包时提示图标格式错误
确保 `build/icon.ico` 是有效的 ICO 文件，包含多种尺寸（16x16 到 256x256）。

### Q: Windows 安装程序被杀毒软件拦截
这是因为应用没有代码签名。解决方案：
1. 购买代码签名证书（推荐：DigiCert, Sectigo）
2. 使用 electron-builder 的签名功能：
   ```json
   {
     "win": {
       "certificateFile": "path/to/certificate.pfx",
       "certificatePassword": "password",
       "signingHashAlgorithms": ["sha256"]
     }
   }
   ```

### Q: 打包后应用体积过大
Electron 应用通常在 100MB+。优化方法：
1. 使用 `asar` 打包（默认启用）
2. 排除不必要的文件
3. 压缩资源文件

### Q: macOS 应用无法打开
需要 Apple Developer 签名。配置：
```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  }
}
```

### Q: 应用启动后黑屏/白屏
可能的原因和解决方案：

1. **检查显卡驱动**：Electron 依赖 GPU 渲染，更新显卡驱动
2. **禁用 GPU 加速**：在快捷方式目标中添加 `--disable-gpu` 参数
3. **检查控制台错误**：
   - 按 `Ctrl+Shift+I` 打开开发者工具
   - 查看 Console 标签页的错误信息
4. **清除应用数据**：删除 `%APPDATA%/Anything Feynman` 目录

### Q: 应用显示加载中但无响应
这通常表示 JavaScript 执行出错：

1. 打开开发者工具查看错误（`Ctrl+Shift+I`）
2. 检查是否有 CSP (Content Security Policy) 阻止了资源加载
3. 尝试重新安装应用

---

## 📖 使用指南

### 基本流程
1. **配置 AI 模型**：在设置中配置 OpenAI 或其他兼容的 AI 模型
2. **创建笔记本**：为学习主题创建笔记本
3. **新建笔记**：开始记录和学习

### 编程学习模式
1. 点击顶部栏的「通用模式」按钮切换到编程模式
2. 点击下拉箭头选择编程语言
3. 输入代码并向 AI 学生解释你的理解
4. AI 会提出问题帮助你发现理解盲区

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存笔记 |
| `Ctrl/Cmd + M` | 切换公式模式 |
| `Ctrl/Cmd + \` | 切换学生面板 |
| `Ctrl/Cmd + Shift + H` | 快捷键帮助 |
| `Ctrl/Cmd + Shift + V` | 语音输入 |

---

## 📁 项目结构

```
.
├── src/
│   ├── main/          # Electron 主进程
│   ├── preload/       # 预加载脚本
│   ├── renderer/      # React 渲染进程
│   │   ├── components/   # UI 组件
│   │   │   ├── code/     # 编程学习模式组件
│   │   │   ├── cpp/      # C++ 原有组件
│   │   │   ├── help/     # 帮助文档
│   │   │   └── mode/     # 模式切换
│   │   ├── hooks/        # React Hooks
│   │   ├── lib/          # 工具库
│   │   │   ├── code/     # 编程学习提示词
│   │   │   └── cpp/      # C++ 提示词
│   │   ├── pages/        # 页面
│   │   └── store/        # Zustand 状态管理
│   └── shared/        # 共享代码
├── build/             # 打包资源（图标等）
├── resources/         # 应用资源
└── out/               # 构建输出
```

---

## 🔧 技术栈

- **框架**: Electron + React 18
- **构建**: electron-vite + Vite 6
- **语言**: TypeScript 5.7
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5
- **UI 组件**: Radix UI
- **编辑器**: CodeMirror 6
- **AI**: OpenAI API (兼容多种模型)

---

## 📝 更新日志

### v1.0.0
- 🎉 **正式版发布**
- ✨ **游戏化新手引导系统**
  - 首次使用欢迎弹窗，询问用户是否需要引导
  - 交互式步骤引导，高亮聚光灯效果展示核心功能
  - 用户可随时跳过或重新开始教程
  - 引导步骤：欢迎 → 笔记本管理 → 创建笔记本 → 模式切换 → AI学生面板 → 帮助按钮 → 设置
- 📖 **完善的用户指导文档**
  - 详细的 AI 模型配置指南，帮助非技术用户完成配置
  - 核心概念解释：API Key、Base URL、Model、Temperature
  - 6 个主流 AI 服务商配置示例（DeepSeek、OpenAI、通义千问、Kimi、智谱、Ollama）
  - 扩展 FAQ 覆盖更多问题场景
  - 学习技巧和自检清单
- 🎨 优化帮助文档 UI 结构，增加代码块、信息框、表格等组件
- 🔧 状态持久化优化，教程完成状态存储在 localStorage

### v0.1.1
- ✨ 扩展 C++ 模式为通用编程学习模式
- ✨ 支持 C/C++、Python、Java、JavaScript 四种语言
- ✨ 新增用户使用指导功能
- ✨ 每种语言独立的学生人格和误解库
- 🎨 新增应用图标（经典原子模型）
- 🐛 修复 CodeMirror 依赖缺失导致的打包失败
- 🐛 修复 Windows 打包权限问题（禁用代码签名）
- 🐛 修复应用启动黑屏/加载卡住问题
  - 移除过于严格的 CSP 策略
  - 设置 webSecurity: false 以允许本地文件加载
  - 修复 verificationCache 初始化时的 localStorage 访问问题
  - 修复 mode.slice.ts 中的 getter 语法问题
  - 添加默认主题属性和加载指示器
- 🔧 完善 electron-vite 配置（添加 base: './'）
- 🔧 完善打包配置，支持 Windows/macOS/Linux
- 📝 添加详细的打包发布指南和故障排除

### v0.1.0
- 🎉 初始版本
- ✅ 基础费曼学习工作流
- ✅ C++ 专项学习模式
- ✅ 康奈尔笔记格式
- ✅ 知识图谱

---

## 📄 许可证

MIT License

---

**作者**: wysbmm-cy, Aurolystant

**项目地址**: https://github.com/wysbmm-cy/feiman
