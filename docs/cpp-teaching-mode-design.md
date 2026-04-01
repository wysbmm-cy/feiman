# C++ 特化教学模式 - 完整设计文档

## 🎯 设计哲学

**核心原则：零代码编辑，纯对话教学**

- ❌ 不写代码
- ❌ 不用 IDE
- ❌ 不运行程序
- ✅ 用自然语言解释概念
- ✅ 通过对话暴露理解盲区
- ✅ AI 扮演学生，用户扮演老师

---

## 📦 已完成组件

### 1. 状态管理 ✅
- **文件**: `src/renderer/src/store/slices/mode.slice.ts`
- **功能**: 
  - 模式切换（通用/C++）
  - C++ 配置（难度、关注领域、学生人格）
  - 模式持久化

### 2. UI 组件 ✅
- **ModeToggle** (`src/renderer/src/components/mode/ModeToggle.tsx`)
  - 模式切换开关
  - 视觉反馈（颜色、动画、图标）
  - 进度显示

- **ModeBanner** (`src/renderer/src/components/mode/ModeBanner.tsx`)
  - C++ 模式欢迎横幅
  - 学习进度概览
  - 退出按钮

- **ModeIndicator** (`src/renderer/src/components/mode/ModeIndicator.tsx`)
  - 小型模式指示器
  - 适合放在标题栏

### 3. AI 人格配置 ✅
- **文件**: `src/renderer/src/lib/cpp/cpp-student-personality.ts`
- **功能**:
  - 学生 "小方" 的完整档案
  - 9 个 C++ 常见误解（含测试问题）
  - 基于概念类型获取相关误解
  - 生成学生问题的工具函数

### 4. AI 提示词生成器 ✅
- **文件**: `src/renderer/src/lib/cpp/cpp-prompts.ts`
- **功能**:
  - 生成 C++ 特化学生 AI 系统提示词
  - 生成 C++ 特化专家 AI 系统提示词
  - 6 级理解层级定义（语法记忆 → UB 和陷阱）
  - 按概念类型的验证策略

---

## 🎮 交互流程示例

### 场景：用户学习"右值引用与移动语义"

#### 步骤 1: 进入 C++ 模式
```
用户点击 ModeToggle → 切换到 C++ 模式
界面变化：
- 整体配色变为深蓝主题
- ModeBanner 显示欢迎信息和进度
- 侧边栏显示 C++ 概念图谱
```

#### 步骤 2: 选择学习概念
```
用户在概念图谱点击"移动语义"
系统：
- 创建概念节点
- 加载相关的常见误解
- 初始化对话
```

#### 步骤 3: 费曼教学对话
```
学生 AI (小方):
"老师，我有个困惑... 🤔

你说 && 是右值引用，但为什么这里:
`auto&& x = y;`
如果 y 是左值，x 是什么类型？

我之前理解的是引用就是别名，
但听你的讲解好像不是这样？

特别是关于引用折叠的部分，
我有点混乱了..."

---

用户输入解释:
"这里 auto&& 是万能引用。
如果 y 是左值，根据引用折叠规则，
auto&& 会变成 auto&，也就是左值引用。

引用折叠规则是：
- T& & -> T&
- T& && -> T&  
- T&& & -> T&
- T&& && -> T&&"

---

学生 AI 追问:
"等等！🤯 我有点跟不上了...

你说 T& & 变成 T&，
那 T& && 也变成 T&？
为什么有两个 & 和一个 && 结果一样？

还有，T&& && 变成 T&&，
这是唯一保持 && 的情况吗？

我突然想到一个实际问题：
如果我有一个函数:
```cpp
template<typename T>
void foo(T&& x) { ... }
```

然后调用:
foo(42);      // 42 是右值
int y = 42;
foo(y);       // y 是左值

那在这两个调用中：
1. T 分别被推导成什么？
2. T&& 分别是什么类型？
3. x 在函数体内是左值还是右值？

老师，我是不是想得太复杂了？
但如果不搞清楚这些，
我感觉自己根本不能正确地使用万能引用..."

---

[对话继续... 直到专家 AI 评估用户理解深度]
```

#### 步骤 4: 专家评估
```
专家 AI:
{
  "understandingLevel": 3,
  "score": 72,
  "depth": "conceptual",
  "blindSpots": [
    "引用折叠的完整规则表",
    "万能引用中 T 的推导规则", 
    "函数体内 x 是左值的事实"
  ],
  "strengths": [
    "理解 auto&& 和 T&& 的关系",
    "能区分左值和右值的基本概念",
    "知道引用折叠的存在"
  ],
  "nextSteps": {
    "reviewConcepts": ["引用折叠规则表", "std::forward 的作用"],
    "practiceAreas": ["完美转发的实现", "移动构造函数"],
    "unlockConcepts": ["emplace_back 的实现原理"]
  }
}
```

---

## 🎨 C++ 模式视觉主题

### 配色方案
```css
/* 主色调 - 深蓝 */
--cpp-primary: #3182ce;
--cpp-primary-dark: #1a365d;
--cpp-primary-light: #63b3ed;

/* 强调色 - 科技蓝 */
--cpp-accent: #00d4ff;
--cpp-accent-glow: rgba(0, 212, 255, 0.3);

/* 功能色 */
--cpp-success: #48bb78;
--cpp-warning: #ecc94b;
--cpp-error: #fc8181;

/* 背景 */
--cpp-bg: #0d1b2a;
--cpp-bg-elevated: #1b263b;
--cpp-bg-overlay: rgba(13, 27, 42, 0.9);
```

### 视觉元素
- **图标**：使用 Terminal、Code2、Cpu 等科技图标
- **装饰**：代码片段背景、电路板纹理（微妙）
- **动画**：蓝色光晕、脉冲效果、打字机效果

---

## 🚀 快速集成指南

### 1. 添加 Mode Store
已完成：`src/renderer/src/store/slices/mode.slice.ts`

### 2. 添加 UI 组件
已完成：
- `ModeToggle.tsx` - 切换开关
- `ModeBanner.tsx` - 欢迎横幅
- `ModeIndicator.tsx` - 小型指示器

### 3. 添加到主界面
```tsx
// 在 TitleBar 或 Sidebar 中添加
<ModeToggle />

// 在 C++ 模式下显示横幅
{isCppMode() && <ModeBanner />}
```

### 4. 配置 AI 提示词
使用 `cpp-prompts.ts` 中的生成器：
```typescript
const studentPrompt = generateCppStudentSystemPrompt({
  concept: '右值引用',
  conceptType: 'modern_feature',
  userExplanation: '...'
})
```

---

## 📝 下一步开发计划

### 已完成的 ✅
1. Mode Store 和状态管理
2. ModeToggle、ModeBanner、ModeIndicator 组件
3. C++ 学生 AI 人格配置
4. C++ 提示词生成器
5. C++ 教学专用类型定义

### 待开发 🚧
1. **C++ 概念图谱组件** - 可视化概念依赖关系
2. **C++ 特化学生 AI Hook** - 集成到对话流程
3. **C++ 验证场景生成器** - 自动生成测试场景
4. **C++ 学习路径推荐** - 基于掌握情况推荐学习路线

---

这个设计是否符合你的预期？我可以继续开发剩余的组件！
