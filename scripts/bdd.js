"use strict";
/* 极简 ROBDD(约简有序二元决策图)实现
 * 用于含重复底事件故障树的精确概率计算。
 * 原理: 当同一底事件被多个门引用时, OR/AND 独立性递归公式不再精确,
 * 必须按布尔语义(同一事件状态唯一)计算。BDD 是商业 FTA 工具的标准做法。
 */
class Robdd {
  constructor(probOfVar, maxNodes) {
    // 节点 0 = 常假, 1 = 常真
    this.nodes = [{ v: -1, low: 0, high: 0 }, { v: -1, low: 1, high: 1 }];
    this.unique = new Map();
    this.applyMemo = new Map();
    this.probMemo = new Map();
    this.probOfVar = probOfVar;   // 变量序号 -> 失效概率
    this.maxNodes = maxNodes || 2000000;
  }
  mk(v, low, high) {
    if (low === high) return low;             // 约简规则
    if (this.nodes.length >= this.maxNodes) throw new Error("BDD 节点数超限(变量序不佳或模型过大)");
    const key = v + "|" + low + "|" + high;
    let id = this.unique.get(key);
    if (id === undefined) { id = this.nodes.length; this.nodes.push({ v, low, high }); this.unique.set(key, id); }
    return id;
  }
  varNode(vi) { return this.mk(vi, 0, 1); }
  apply(op, u, v) {
    if (op === "or") { if (u === 1 || v === 1) return 1; if (u === 0) return v; if (v === 0) return u; if (u === v) return u; }
    else { if (u === 0 || v === 0) return 0; if (u === 1) return v; if (v === 1) return u; if (u === v) return u; }
    const key = op + u + "," + v;
    let r = this.applyMemo.get(key);
    if (r !== undefined) return r;
    const top = Math.min(this.nodes[u].v, this.nodes[v].v);
    const coH = (x) => this.nodes[x].v === top ? this.nodes[x].high : x;
    const coL = (x) => this.nodes[x].v === top ? this.nodes[x].low : x;
    r = this.mk(top, this.apply(op, coL(u), coL(v)), this.apply(op, coH(u), coH(v)));
    this.applyMemo.set(key, r);
    return r;
  }
  prob(u) {
    if (u === 0) return 0;
    if (u === 1) return 1;
    let p = this.probMemo.get(u);
    if (p !== undefined) return p;
    const pv = this.probOfVar(this.nodes[u].v);
    p = pv * this.prob(this.nodes[u].high) + (1 - pv) * this.prob(this.nodes[u].low);
    this.probMemo.set(u, p);
    return p;
  }
}
function kSubsets(arr, k) {
  const res = [];
  const rec = (start, cur) => {
    if (cur.length === k) { res.push(cur.slice()); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  return res;
}
module.exports = { Robdd, kSubsets };
