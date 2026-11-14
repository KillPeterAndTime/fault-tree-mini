# FaultTree Mini — 轻量级故障树绘制与计算工具

|                         |      |
| ----------------------- | ---- |
| [English](README_EN.md) | 简体中文 |

一个 **单文件、零依赖、打开即用** 的故障树分析（FTA）工具：draw.io 式的拖拽绘制体验 + 内置定量计算 + 本地项目文件 + 图片导出。图形符号遵循 **IEC 61025 / GB/T 4888-2009** 惯例，支持 **ARP4761A / AC 25.1309-1B** 失效状态分级概率目标判定，计算引擎经公开算例与公开基准题双重验证。

> **为什么做这个工具？** 主流商业 FTA 软件（RAM Commander、Isograph FaultTree+ 等）功能强大但界面老旧、价格高、许可复杂；而"快速画一棵树、快速算个数"的场景，市面上缺少趁手的免费工具。FaultTree Mini 填补的就是这个空白。

## 特性

- **拖拽绘制**：左侧元件库拖入顶事件、中间事件、基本事件、未展开事件、房形事件、OR/AND/表决门（k/n），全部采用标准 FTA 符号；节点底部圆点拖拽连线，自动防环路；直角总线式走线，大型树整洁不乱
- **失效数据输入**：底事件支持失效率 λ + 任务时间 t（自动换算 q = 1−e^(−λt)）或直接输入概率；支持 /小时、/飞行小时、/飞行循环、/起降 时间基准
- **定量计算**：
  - OR 门概率求和 1−∏(1−qᵢ)，AND 门概率积 ∏qᵢ（交集），表决门 k/n 精确 Poisson-binomial
  - 检测到底事件被多个门引用（共用部件）时自动切换 **ROBDD 二元决策图** 精确求解（与 SCRAM、FaultTree+ 同类方法）
  - 顶事件可选 ARP4761A 失效状态等级（灾难 ≤1E-9 / 危险 ≤1E-7 / 较大 ≤1E-5 / 较小 ≤1E-3 /飞行小时），计算后自动显示 ✓/✗ 判定
- **项目文件**：`.fta.json` 本地保存（Chrome/Edge 支持写回原文件），本地自动暂存防丢失
- **导出**：PNG（2 倍清晰度）/ SVG
- **大树友好**：缩放控制条、适应视图（F）、顶事件定位（T）、中键平移、自动布局

## 快速开始

**无需安装**——直接用浏览器（推荐 Chrome / Edge）打开 [`index.html`](index.html) 即可。

或访问在线版（GitHub Pages）：`https://<你的用户名>.github.io/fault-tree-mini/`

内置"飞机刹车系统失效"示例模型可立即试算；`examples/` 目录下有 7 个可直接打开的项目文件（含 3 个 Aralia 公开基准题）。

## 快捷键

| 按键                  | 功能          |
| ------------------- | ----------- |
| `Ctrl+S` / `Ctrl+O` | 保存 / 打开项目   |
| `F`                 | 适应视图（显示整棵树） |
| `T`                 | 定位顶事件       |
| `+` / `-` / `0`     | 缩放 / 复位     |
| `Delete`            | 删除选中节点及其子树  |
| 中键拖动                | 平移画布（任意位置）  |

详细操作见 [docs/USAGE.md](docs/USAGE.md)。

## 计算引擎的可信度

我们不只"感觉对"，而是建立了可复现的验证体系（[docs/VERIFICATION.md](docs/VERIFICATION.md)）：

- 4 个已发表公开算例精确吻合（NUREG-0492 风格双泵、CSSBB 教程、教学算例、经典 2oo3 表决）
- 300 棵随机生成故障树（半数含共用底事件）对照布尔枚举精确解，最大误差 1.2×10⁻¹⁵
- 3 个 Aralia 公开基准题（25/49/89 底事件）蒙特卡洛交叉验证一致

回归测试：`node tests/verify-calc.js`

## 目录结构

```
├── index.html              # 工具本体（单文件，无依赖）
├── examples/               # 7 个示例项目文件（含 3 个 Aralia 基准题）
├── tests/
│   └── verify-calc.js      # 回归验证：公开算例 + λ 换算 + 随机树 Fuzz
├── scripts/
│   ├── bdd.js              # ROBDD 精确计算引擎（独立模块）
│   └── openpsa-convert.js  # Open-PSA (Aralia) 格式 → .fta.json 转换器
├── docs/
│   ├── USAGE.md            # 使用说明（docs/USAGE_EN.md 为英文版）
│   ├── VERIFICATION.md     # 验证体系与结果（含英文版）
│   ├── STANDARDS.md        # 符号与标准对齐说明（含英文版）
│   └── PUBLISH.md          # 本仓库发布步骤
└── .github/                # FUNDING、issue 模板
```

## 标准对齐

- **图形符号**：IEC 61025:2006 附录 A 惯例画法 + GB/T 4888-2009《故障树名词术语和符号》
- **概率目标**：AC 25.1309-1B / ARP4761A 失效状态分级（灾难/危险/较大/较小）对应每飞行小时概率目标
- 详见 [docs/STANDARDS.md](docs/STANDARDS.md)

## 路线图

- [ ] 最小割集（MCS）枚举与显示
- [ ] 底事件重要度分析（Fussell-Vesely）
- [ ] Open-PSA Model Exchange Format 直接导入/导出（当前经转换脚本）
- [ ] 转移符号（三角）、禁门（INHIBIT）、顺序与门（PAND）、异或门（XOR）
- [ ] 多页/多树项目
- [ ] 云协作版（多人编辑、权限审计）——远期，等社区需求信号

欢迎提 issue 告诉你最想要哪个。

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。改计算逻辑请务必跑 `node tests/verify-calc.js` 回归。

## 许可证

[MIT](LICENSE) — 免费使用、修改、分发，包括商用。

## 赞赏

如果这个工具帮你省了时间，欢迎请作者喝杯咖啡（完全自愿，不打赏也一样用）：

- 微信：扫描下方赞赏码（收款零手续费，金额 1~200 元自选）
- 海外：PayPal — 转账时输入账户 `songlike163@hotmail.com` 即可（该邮箱亦可用于联系作者）

<p align="center">
  <img src="docs/images/wechat-reward.png" alt="微信赞赏码" width="280">
</p>

作者不承诺任何打赏回报；所有功能永久免费。
