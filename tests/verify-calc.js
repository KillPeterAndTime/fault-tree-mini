/**
 * FaultTree Mini 计算引擎验证脚本
 * 运行: node tests/verify-calc.js
 *
 * 验证方式（双重）:
 *  1. 已发表公开算例对照（NUREG-0492 风格双泵算例、CSSBB 教程算例、
 *     公开教学算例、经典 2oo3 表决算例）
 *  2. 随机故障树 Fuzz 测试: 随机生成树形结构，工具递归算法结果
 *     与"遍历所有底事件状态组合"的布尔精确解逐项比对
 */
const fs = require("fs");
const path = require("path");

/* ---------- 1. 从 HTML 中提取工具的真实计算引擎 ---------- */
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function extract(re, name) {
  const m = html.match(re);
  if (!m) throw new Error("无法从 HTML 提取 " + name);
  return m[0];
}

const childrenSrc = extract(/function childrenOf\(id\) \{[^\n]*\}\nfunction parentOf\(id\) \{[^\n]*\}/, "childrenOf/parentOf");
const probSrc = extract(/function basicProb\(n\) \{[\s\S]*?(?=\nfunction runCalc)/, "概率计算块");

const engineSrc = `
"use strict";
const GATES = new Set(["or", "and", "vote"]);
let nodes = {}, edges = [];
${childrenSrc}
${probSrc}
return { computeProb, basicProb, setModel(n, e) { nodes = n; edges = e; }, clearCache(list) { list.forEach(n => delete n._p); _subMemo.clear(); _bddCache.clear(); } };
`;

const engine = new Function(engineSrc)();

/* ---------- 2. 暴力枚举精确解（Ground Truth） ---------- */
function gateLogic(type, kidVals, k) {
  if (type === "or") return kidVals.some(Boolean);
  if (type === "and") return kidVals.every(Boolean);
  return kidVals.filter(Boolean).length >= Math.min(k, kidVals.length);
}
function exactTopProb(nodesObj, edgesArr, topId) {
  const basicIds = Object.values(nodesObj).filter(n => !["or", "and", "vote"].includes(n.type)).map(n => n.id);
  const N = basicIds.length;
  const kids = (id) => edgesArr.filter(e => e.from === id).map(e => e.to);
  const evalNode = (id, st) => {
    const n = nodesObj[id];
    if (!["or", "and", "vote"].includes(n.type)) return st.get(id) === 1;
    return gateLogic(n.type, kids(id).map(c => evalNode(c, st)), n.k || 1);
  };
  let p = 0;
  for (let s = 0; s < (1 << N); s++) {
    const st = new Map();
    let w = 1;
    basicIds.forEach((id, i) => {
      const on = !!(s >> i & 1);
      st.set(id, on ? 1 : 0);
      const q = nodesObj[id].prob;
      w *= on ? q : (1 - q);
    });
    if (evalNode(topId, st)) p += w;
  }
  return p;
}

/* ---------- 3. 随机树生成 ---------- */
let seed = 20261114;
function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
function randInt(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

function genRandomTree(share) {
  const nBasic = randInt(1, 10);
  const nodesArr = [], edgesArr = [];
  let idc = 0;
  const nid = () => "n" + (++idc);
  // 底事件
  for (let i = 0; i < nBasic; i++) {
    nodesArr.push({ id: nid(), type: "basic", prob: rnd() * 0.99, inputMode: "prob", k: 1, n: 1, rate: 1e-5, time: 1000 });
  }
  // 自底向上合并
  let pool = nodesArr.map(n => n.id);
  let guard = 0;
  while (pool.length > 1 && guard++ < 40) {
    const nKids = randInt(1, Math.min(pool.length, 4));
    const kids = pool.slice(0, nKids);
    pool = pool.slice(nKids);
    const type = ["or", "and", "vote"][randInt(0, 2)];
    const k = type === "vote" ? randInt(1, nKids) : 1;
    const g = { id: nid(), type, prob: rnd() * 0.5, inputMode: "prob", k, n: nKids, rate: 1e-5, time: 1000 };
    nodesArr.push(g);
    kids.forEach(kid => edgesArr.push({ from: g.id, to: kid }));
    pool.push(g.id);
  }
  // 若还剩单节点则套一层门
  if (pool.length === 1) {
    const only = nodesArr.find(n => n.id === pool[0]);
    if (!["or", "and", "vote"].includes(only.type)) {
      const g = { id: nid(), type: "or", prob: 0, inputMode: "prob", k: 1, n: 1, rate: 1e-5, time: 1000 };
      nodesArr.push(g);
      edgesArr.push({ from: g.id, to: only.id });
      pool = [g.id];
    }
  }
  // 模拟真实工程: 以一定概率让底事件被多个门共用(重复引用, 需 BDD 精确计算)
  if (share) {
    const gatesArr = nodesArr.filter(n => ["or", "and", "vote"].includes(n.type));
    const basicsArr = nodesArr.filter(n => !["or", "and", "vote"].includes(n.type));
    const nShare = randInt(1, Math.min(4, gatesArr.length));
    for (let i = 0; i < nShare; i++) {
      const g = gatesArr[randInt(0, gatesArr.length - 1)];
      const b = basicsArr[randInt(0, basicsArr.length - 1)];
      if (!edgesArr.some(e => e.from === g.id && e.to === b.id)) edgesArr.push({ from: g.id, to: b.id });
    }
  }
  return { nodesArr, edgesArr, top: pool[0] };
}

/* ---------- 4. 测试执行 ---------- */
let pass = 0, fail = 0;
function check(name, got, want, tol = 1e-10) {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want));
  if (ok) { pass++; console.log(`  ✓ ${name}: ${got.toExponential(6)} (期望 ${want})`); }
  else { fail++; console.log(`  ✗ ${name}: 得到 ${got.toExponential(6)}, 期望 ${want}`); }
}

console.log("=== A. 已发表公开算例对照 ===");
const published = [
  ["例1-双泵冗余系统.fta.json", "双泵 AND(0.01,0.01)", 1e-4],
  ["例2-生产线计划外停机.fta.json", "CSSBB 算例 OR(AND(0.02,0.05), OR(0.01,0.004))", 1 - (1 - 0.02 * 0.05) * (1 - (1 - 0.99 * 0.996))],
  ["例3-控制器与双执行器.fta.json", "OR(0.02, AND(0.10,0.05))", 0.0249],
  ["例4-三取二表决系统.fta.json", "2oo3 表决 p=0.1", 0.028]
];
for (const [file, desc, want] of published) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "examples", file), "utf8"));
  const nodesObj = {}, edgesArr = d.edges;
  for (const n of d.nodes) nodesObj[n.id] = n;
  engine.setModel(nodesObj, edgesArr);
  engine.clearCache(Object.values(nodesObj));
  const got = engine.computeProb(d.nodes[0].id, new Set(), []);
  check(`${file.replace(".fta.json", "")} — ${desc}`, got, want, 1e-6);
}

// λ→q 换算: λ=1e-5/h, t=10000h → q = 1-e^-0.1 = 0.09516258196...
console.log("\n=== B. 失效率-概率换算 ===");
check("q = 1-exp(-λt), λ=1e-5, t=10000", engine.basicProb({ inputMode: "rate", rate: 1e-5, time: 10000 }), 1 - Math.exp(-0.1));

console.log("\n=== C. 随机树 Fuzz 测试（对照布尔枚举精确解） ===");
const TRIALS = 300;
let fuzzFail = 0, maxErr = 0;
for (let t = 0; t < TRIALS; t++) {
  const { nodesArr, edgesArr, top } = genRandomTree(t % 2 === 1);  // 一半含共用底事件
  const nodesObj = {};
  for (const n of nodesArr) nodesObj[n.id] = n;
  engine.setModel(nodesObj, edgesArr);
  engine.clearCache(nodesArr);
  let got;
  try { got = engine.computeProb(top, new Set(), []); }
  catch (e) { console.log(`  ✗ 树#${t} 抛异常: ${e.message}`); fuzzFail++; continue; }
  const want = exactTopProb(nodesObj, edgesArr, top);
  const err = Math.abs(got - want);
  maxErr = Math.max(maxErr, err);
  if (err > 1e-12) { fuzzFail++; console.log(`  ✗ 树#${t}: 工具=${got.toExponential(10)}, 精确=${want.toExponential(10)}`); }
}
if (fuzzFail === 0) { pass++; console.log(`  ✓ ${TRIALS} 棵随机树(半数含共用底事件/BDD路径)全部通过，最大绝对误差 ${maxErr.toExponential(3)}`); }
else { fail++; console.log(`  ✗ ${fuzzFail}/${TRIALS} 棵树不匹配`); }

console.log(`\n========== 结果: ${pass} 项通过, ${fail} 项失败 ==========`);
process.exit(fail ? 1 : 0);
