# 本仓库发布步骤（第一版）

> 这份文档是给你自己的操作清单，发布后可删除或归档。

## 1. 发布前检查

- [x] **版权人实名**（已完成：LICENSE 第 3 行为 "Copyright (c) 2026 Peter"）
- [x] **赞赏渠道**（已定稿并配置完成：微信赞赏码 + PayPal，费率≈0；第三方中转平台如面包多 5.7%~13%、爱发电 6% 均不值得）：
  1. ~~生成微信赞赏码~~（已完成：图片在 `docs/images/wechat-reward.png`，README.md 赞赏区已嵌入）
  2. ~~PayPal 填入~~（已完成：songlike163@hotmail.com，已填入 README.md / README_EN.md / FUNDING.yml）
  3. 国内只保留微信赞赏码一个入口（不使用支付宝收款码）
  4. 如日后担心码暴露：微信「收付款 → 赞赏码 → 赞赏设置」重新生成即可作废旧码，替换 `docs/images/wechat-reward.png` 即可
- [x] 确认所有内容均为个人业余开发、不含公司涉密信息（已确认）
- [x] `node tests/verify-calc.js` 全绿（6/6 通过）

## 2. 创建仓库并推送

```bash
cd GitHub
git init
git add .
git commit -m "feat: FaultTree Mini v0.1.0 首个公开版本"
git branch -M main
git remote add origin https://github.com/<你的用户名>/fault-tree-mini.git
git push -u origin main
```

## 3. 开启 GitHub Pages（在线版）

仓库 → Settings → Pages → Source 选 `main` 分支 `/ (root)` → Save。  
几分钟后访问 `https://<你的用户名>.github.io/fault-tree-mini/`。  
（index.html 已放在仓库根目录，Pages 直接可开。）

## 4. 建议的仓库设置

|   |   |   |
| - | - | - |

|   |   |   |
| - | - | - |

- About 栏描述：`轻量级故障树(FTA)绘制与计算工具 | Lightweight fault tree editor & calculator | IEC 61025 / GB-T 4888 / ARP4761A`
- Topics：`fault-tree-analysis` `reliability` `safety` `ram` `aerospace` `fta` `open-source`
- 勾选 Releases：以后每个版本发 tag（`v0.1.0`）并附 CHANGELOG 摘要

## 5. 传播（可选）

- 知乎/公众号：写"为什么我做了个开源故障树工具"
- 可靠性工程社区、RAM Commander/Isograph 吐槽贴下自然引流
- 欢迎被 SCRAM/FTA 社区注意到：Open-PSA 转换器是敲门砖
