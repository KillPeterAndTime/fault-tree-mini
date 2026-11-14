/**
 * Open-PSA MEF XML → FaultTreeMini .fta.json 转换 + 蒙特卡洛独立验证
 * 用法: node scripts/openpsa-convert.js <输入.xml> <输出.fta.json> [MC样本数]
 *
 * Open-PSA Model Exchange Format 是 SCRAM/XFTA 等公开工具的标准交换格式，
 * Aralia 基准库(https://github.com/rakhimov/scram) 是故障树领域的标准基准题集。
 *
 * 转换要点: Open-PSA 允许门被多个父引用(DAG)，本工具是严格树结构，
 * 因此被共享的子树会被复制展开后再输出。
 *
 * 验证方式: 引擎精确递归结果 vs 蒙特卡洛布尔仿真(独立方法)，
 * 两者应在统计误差范围内一致。
 */
const fs = require("fs");

/* ---------- 极简 XML 解析(仅覆盖 Open-PSA 所需子集) ---------- */
function parseGates(xml) {
  const gates = {};
  const re = /<define-gate name="([^"]+)">([\s\S]*?)<\/define-gate>/g;
  let m;
  while ((m = re.exec(xml))) gates[m[1]] = m[2];
  return gates;
}
function parseBasics(xml, scale) {
  const basics = {};
  const re = /<define-basic-event name="([^"]+)">\s*<float value="([^"]+)"\/?\s*>/g;
  let m;
  while ((m = re.exec(xml))) {
    let p = parseFloat(m[2]);
    if (scale) p = Math.min(0.9, p * scale);  // 缩放放大用于蒙特卡洛验证
    basics[m[1]] = p;
  }
  return basics;
}
function parseFormula(body, gateName) {
  const f = body.match(/<(or|and|atleast|not|null)([^>]*)>([\s\S]*?)<\/\1>/);
  if (!f) throw new Error(`门 ${gateName} 未找到可识别的公式(or/and/atleast)`);
  const type = f[1];
  if (type === "not" || type === "null") throw new Error(`非连贯树(not/null 门)暂不支持: ${gateName}`);
  const inner = f[3];
  const kids = [];
  const re = /<(gate|basic-event|const)\s+name="([^"]+)"[^>]*\/?>(?:\s*<[^>]+value="([^"]+)"[^>]*\/?>)?/g;
  let m;
  while ((m = re.exec(inner))) {
    if (m[1] === "gate") kids.push({ kind: "gate", name: m[2] });
    else if (m[1] === "basic-event") kids.push({ kind: "basic", name: m[2] });
    else kids.push({ kind: "const", name: m[2], value: parseFloat(m[3]) });
  }
  const k = type === "atleast" ? parseInt((f[2].match(/number="(\d+)"/) || [])[1] || "1") : 1;
  return { type, k, kids };
}

/* ---------- 转换为树模型(共享子树复制展开) ---------- */
function convert(xml, scale) {
  const gates = parseGates(xml), basics = parseBasics(xml, scale);
  const formulas = {};
  for (const g in gates) formulas[g] = parseFormula(gates[g], g);
  const allGateKids = new Set();
  for (const g in formulas) formulas[g].kids.forEach(k => { if (k.kind === "gate") allGateKids.add(k.name); });
  const roots = Object.keys(formulas).filter(g => !allGateKids.has(g));
  if (!roots.length) throw new Error("未找到根门(所有门都被引用)");
  const root = roots[0];

  const nodesArr = [], edges = [];
  const basicNode = {};   // name -> node (底事件不复制，天然唯一)
  let copyCount = {};

  function copySubtree(ref) {
    if (ref.kind === "basic") {
      if (!basics[ref.name] === undefined || !(ref.name in basics)) throw new Error(`底事件 ${ref.name} 未定义概率`);
      if (!basicNode[ref.name]) {
        const n = mkNode("basic", ref.name, "prob");
        n.prob = basics[ref.name];
        basicNode[ref.name] = n;
        nodesArr.push(n);
      }
      return basicNode[ref.name].id;
    }
    if (ref.kind === "const") {
      const n = mkNode("undeveloped", ref.name, "prob");
      n.prob = ref.value;
      nodesArr.push(n);
      return n.id;
    }
    // gate 引用: 若已有父(共享)则整棵子树复制
    const shared = copyCount[ref.name] > 0;
    copyCount[ref.name] = (copyCount[ref.name] || 0) + 1;
    const id = shared ? `${ref.name}@${copyCount[ref.name]}` : ref.name;
    const node = mkNode(formulaTypeToNodeType(formulas[ref.name]), id, "rate");
    if (formulas[ref.name].type === "atleast") { node.k = formulas[ref.name].k; node.n = formulas[ref.name].kids.length; }
    nodesArr.push(node);
    for (const kid of formulas[ref.name].kids) {
      const cid = copySubtree(kid);
      edges.push({ from: node.id, to: cid });
    }
    return node.id;
  }

  function formulaTypeToNodeType(t) { return t === "or" ? "or" : t === "and" ? "and" : "vote"; }
  function mkNode(type, id, inputMode) {
    return { id, type, x: 0, y: 0, label: id, desc: type === "undeveloped" ? "Open-PSA const 事件" : "",
             k: 2, n: 3, inputMode, rate: 1e-5, time: 10000, prob: 1e-4, sev: null, unit: "/小时" };
  }

  const topId = copySubtree({ kind: "gate", name: root });
  return { nodesArr, edges, topId, basicsCount: Object.keys(basicNode).length, gateCopies: copyCount };
}

/* ---------- 简单分层布局(与工具内 autoLayout 同思路) ---------- */
function layout(model) {
  const kids = {};
  model.edges.forEach(e => { (kids[e.from] = kids[e.from] || []).push(e.to); });
  const parent = {}; model.edges.forEach(e => parent[e.to] = true);
  const depth = {};
  (function setDepth(id, d) {
    depth[id] = d;
    (kids[id] || []).forEach(c => setDepth(c, d + 1));
  })(model.topId, 0);
  let cursor = 100;
  (function place(id) {
    const cs = kids[id] || [];
    if (!cs.length) { const n = model.nodesArr.find(n => n.id === id); n.x = cursor + 90; cursor += 200; }
    else { const xs = cs.map(c => { place(c); return model.nodesArr.find(n => n.id === c).x; });
           const n = model.nodesArr.find(n => n.id === id);
           n.x = (xs[0] + xs[xs.length - 1]) / 2; }
    const n = model.nodesArr.find(n => n.id === id); n.y = 80 + depth[id] * 120;
  })(model.topId);
}

/* ---------- 蒙特卡洛独立验证 ---------- */
function mcVerify(model, topId, N) {
  const nodeMap = {}; model.nodesArr.forEach(n => nodeMap[n.id] = n);
  const kids = {}; model.edges.forEach(e => { (kids[e.from] = kids[e.from] || []).push(e.to); });
  const basics = model.nodesArr.filter(n => n.type === "basic" || n.type === "undeveloped");
  const isGate = id => ["or", "and", "vote"].includes(nodeMap[id].type);
  function evalNode(id) {
    const n = nodeMap[id];
    if (!isGate(id)) return n._st;
    const cs = kids[id] || [];
    if (n.type === "or") { for (const c of cs) if (evalNode(c)) return true; return false; }
    if (n.type === "and") { for (const c of cs) if (!evalNode(c)) return false; return true; }
    let cnt = 0; for (const c of cs) if (evalNode(c)) cnt++;
    return cnt >= Math.min(n.k || 1, cs.length);
  }
  let hits = 0;
  for (let i = 0; i < N; i++) {
    for (const b of basics) b._st = Math.random() < b.prob;
    if (evalNode(topId)) hits++;
  }
  return hits / N;
}

/* ---------- 主流程 ---------- */
function main() {
  const [,, inFile, outFile, nArg, scaleArg] = process.argv;
  if (!inFile || !outFile) { console.log("用法: node scripts/openpsa-convert.js <输入.xml> <输出.fta.json> [MC样本数] [概率缩放倍数]"); process.exit(1); }
  const xml = fs.readFileSync(inFile, "utf8");
  const scale = scaleArg ? parseFloat(scaleArg) : 0;
  const model = convert(xml, scale);
  layout(model);

  // 引擎精确计算(与 fault-tree-mini.html 相同): 底事件被引用≥2次时用 BDD(布尔语义精确)
  const { Robdd, kSubsets } = require("./bdd");
  const GATES = new Set(["or", "and", "vote"]);
  const nodeMap = {}; model.nodesArr.forEach(n => nodeMap[n.id] = n);
  const kids = {}; model.edges.forEach(e => { (kids[e.from] = kids[e.from] || []).push(e.to); });
  const isLeafType = t => !GATES.has(t) && t !== "top" && t !== "inter";
  // 全局变量序: 自根 DFS 首次遇到底事件的顺序
  const varIndex = new Map(); let viCount = 0;
  (function assign(id) {
    for (const c of (kids[id] || [])) {
      if (isLeafType(nodeMap[c].type)) { if (!varIndex.has(c)) varIndex.set(c, viCount++); }
      else assign(c);
    }
  })(model.topId);
  const varProb = []; for (const [nid, idx] of varIndex) varProb[idx] = nodeMap[nid].prob;
  const bdd = new Robdd(i => varProb[i] ?? 0);
  function build(id) {
    const n = nodeMap[id];
    if (isLeafType(n.type)) return bdd.varNode(varIndex.get(id));
    const cb = (kids[id] || []).map(build);
    if (n.type === "top" || n.type === "inter") {
      if (cb.length === 1) return cb[0];
      return cb.reduce((a, b) => bdd.apply("or", a, b));   // 多输入按 OR 合并
    }
    if (n.type === "or") return cb.reduce((a, b) => bdd.apply("or", a, b));
    if (n.type === "and") return cb.reduce((a, b) => bdd.apply("and", a, b));
    const k = Math.min(n.k || 1, cb.length);
    return kSubsets(cb, k).map(cs => cs.reduce((a, b) => bdd.apply("and", a, b)))
      .reduce((a, b) => bdd.apply("or", a, b));
  }
  const topP = bdd.prob(build(model.topId));

  // 蒙特卡洛(仅在原概率足够大或传入缩放时执行)
  const N = parseInt(nArg || "2000000");
  const mcNeeded = topP * N >= 100 || scale > 0;
  if (!mcNeeded) console.log("\n⚠ 原始概率过小, 跳过蒙特卡洛。可传入概率缩放倍数参数验证结构正确性。");
  if (mcNeeded) {
    console.time("蒙特卡洛用时");
    const mcP = mcVerify(model, model.topId, N);
    console.timeEnd("蒙特卡洛用时");
    const se = Math.sqrt(topP * (1 - topP) / N);
    const rel = Math.abs(mcP - topP) / Math.max(topP, 1e-300);
    const ok = Math.abs(mcP - topP) <= 4 * se + 1e-12;
    console.log(`蒙特卡洛(N=${N}): ${mcP.toExponential(6)} ± ${se.toExponential(2)} (4σ区间)`);
    console.log(`相对偏差: ${(rel * 100).toFixed(2)}%  →  ${ok ? "✓ 一致(统计误差内)" : "✗ 不一致!"}`);
    if (!ok) process.exit(2);
  }

  // 写出项目文件
  const doc = { app: "FaultTreeMini", version: 1, name: outFile.split("/").pop(),
    nodes: model.nodesArr, edges: model.edges, nextId: model.nodesArr.length + 1 };
  fs.writeFileSync(outFile, JSON.stringify(doc, null, 1));
  console.log(`已写出: ${outFile}`);
}
main();
