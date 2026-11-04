# 可达性校验记录

设计说明见 .agents/tasks/scoring-design.md。

## 运行命令
- `node scripts/generate-figures.mjs`：重新生成 src/data/figures.ts 和 src/data/idealPaths.ts（人物文案无变化，只改了 traits；已用 diff 核对，题目与选项文案同样无变化）
- `node scripts/verify-reachability.mjs`：退出码 0
- `pnpm build`（tsc --noEmit && vite build）：通过

## 第二轮（修复评审意见：范围 70→0.01）
- score.ts `agreementToPercent` 改为 [MATCH_FLOOR,1] → [0.01,99.99] 线性映射；仅理想路径（贴合度=1）为 99.99
- verify 脚本断言改为 0.01–99.99：min<10、max>70、≥7/10 档有样本、单档<50%
- `node scripts/verify-reachability.mjs` 退出码 0；`pnpm build` 通过
- 随机均匀答案很难接近某人物理想路径，故高段稀疏（max 83.33），99.99 只来自理想路径

## verify 输出
```
人物 id            理想路径(q01→q10)  第一名      匹配度
libai              a d b a a a b b b b  libai       99.99
dufu               a d b d a d c c c a  dufu        99.99
baijuyi            a d b d c d b c c a  baijuyi     99.99
wangwei            a b a d a a d b d b  wangwei     99.99
menghaoran         b a d d d a b b a a  menghaoran  99.99
sushi              a d b a a d c b a b  sushi       99.99
liqingzhao         a d b d a a b b c a  liqingzhao  99.99
xinqiji            d d b a a d a a c b  xinqiji     99.99
luyou              d a d c d b d c a a  luyou       99.99
quyuan             a d b c a d c b c b  quyuan      99.99
taoyuanming        a a d d a a c b a a  taoyuanming 99.99
caozhi             a d b d a d b b c b  caozhi      99.99
nalanxingde        a b b d a d b b c a  nalanxingde 99.99
ouyangxiu          a d b c a d b b c a  ouyangxiu   99.99
gongzizhen         a d b a b d c a c c  gongzizhen  99.99
lihe               a b b a a a b b c b  lihe        99.99
lishangyin         a d a d a a b b c b  lishangyin  99.99
gaoshi             b a b b d d a a b b  gaoshi      99.99
censhen            b d b b d a a a b b  censhen     99.99
wanganshi          c c c c c c d a d d  wanganshi   99.99
liuyuxi            d a d b d d a a a c  liuyuxi     99.99
hezhang            a d b d a b b c a a  hezhang     99.99
chenziang          a d b a b a a a b b  chenziang   99.99
wentingyun         a b b d a a b b a b  wentingyun  99.99
yanjidao           a b a d a b b b c a  yanjidao    99.99
jiangkui           a b c d a a b b d b  jiangkui    99.99
yuanzhen           a d b d b d d c c a  yuanzhen    99.99
dumu               a d b a a a c b c b  dumu        99.99
yangwanli          a d b d a a b c c b  yangwanli   99.99
fanchengda         c c a c c c d d d d  fanchengda  99.99
huangtingjian      a b b c a a b b d b  huangtingjian 99.99
suqin              a d b a a d b c c a  suqin       99.99
liubang            d a d b c b a d a d  liubang     99.99
liuche             b a c b d c a a b c  liuche      99.99
liushimin          c c c c b c d d d d  liushimin   99.99
wuzetian           c a c c c c d a d c  wuzetian    99.99
kangxi             c c c c c c d d d c  kangxi      99.99
yongzheng          c a c c c c d d d d  yongzheng   99.99
qianlong           a b b d a d c b c d  qianlong    99.99
yingzheng          c c c c c c a d d d  yingzheng   99.99
liubei             d a d b c b d c a a  liubei      99.99
caocao             c c c c c c a a c c  caocao      99.99
zhaokuangyin       c c c c b c c d d c  zhaokuangyin 99.99
zhuyuanzhang       c c c c c c d d a d  zhuyuanzhang 99.99
yangjian           b c c c c c d d d d  yangjian    99.99
wenjing            c c a c c b d c d d  wenjing     99.99
tangxuanzong       b b b d a a c b c d  tangxuanzong 99.99
yongle             b c c b d c a a b d  yongle      99.99
shunzhi            d a a d b b c c a a  shunzhi     99.99
liuxiu             c a d c c b d c a d  liuxiu      99.99
liangwu            a b a d b b c b c a  liangwu     99.99
chongzhen          c c d c c c d c d d  chongzhen   99.99
wuwang             d a c c c c a a d c  wuwang      99.99
zhangzuehou        c c a c b b c c d c  zhangzuehou 99.99
lvzhi              c a c c c c a a a d  lvzhi       99.99
cixi               c a d c c c d d a d  cixi        99.99
liuche2            c c c b c c d d d d  liuche2     99.99
zhuge              c c c c c b d d d d  zhuge       99.99
wangyangming       c c c c c c c c d d  wangyangming 99.99
xuanzang           b a d b d c d a b c  xuanzang    99.99
wangxizhi          c b a d a a b b d b  wangxizhi   99.99
banzhao            c d a c b d c c c a  banzhao     99.99
kongzi             c c a c b d d c c c  kongzi      99.99
laozi              a a c c b b c c a c  laozi       99.99
zhuangzi           a a d a d a b b a b  zhuangzi    99.99
mozi               d c a c c b a c d d  mozi        99.99
sunwu              c c c c c c c d b d  sunwu       99.99
hanxin             d a c b b c a a b c  hanxin      99.99
yuefei             c a d c c c d a d d  yuefei      99.99
zhenghe            b a d b d b a a b d  zhenghe     99.99
zhangqian          d a d b d c a a b d  zhangqian   99.99
simaqian           c a b c b d d c a b  simaqian    99.99
lishizhen          b c d c d c d d d d  lishizhen   99.99
zhangheng          a c c a b a b d d b  zhangheng   99.99
zuchongzhi         c c c a c c b d d d  zuchongzhi  99.99
shenkuo            a c c c b c c d c c  shenkuo     99.99
cailun             a c c c c c b d d d  cailun      99.99
bisheng            c c d c c c b d d d  bisheng     99.99
luban              a c c a c a b d d d  luban       99.99
huatuo             c c a c b c d c d d  huatuo      99.99
simaguang          c c b c c c c d d d  simaguang   99.99
zhuxi              c c c c b c d c d c  zhuxi       99.99
guyanwu            c c c c d c c d d d  guyanwu     99.99
huangzongxi        d d b c b d c c c c  huangzongxi 99.99
xunxiaoke          b a d b d a a a b b  xunxiaoke   99.99
jianzhen           c a d b d c d a b d  jianzhen    99.99
banchao            b a a b d c a a b d  banchao     99.99
weizhongxian_skip  d c c c c c d c d d  weizhongxian_skip 99.99
hairui             d a d c c c d c d d  hairui      99.99
linzexu            d c d c c c d a d d  linzexu     99.99
zhangjuzheng       d c c c c c c d d d  zhangjuzheng 99.99
guanZhong          c c c c b c c d c d  guanZhong   99.99
shangyang          c c d c c c a a d d  shangyang   99.99
qinguan            a d a d a d b b c a  qinguan     99.99
xinqiji2           a d b d a d b b a a  xinqiji2    99.99
caoxueqin          a b b d a a c b c a  caoxueqin   99.99
wuchengen          a d b a d a b b c b  wuchengen   99.99
luoguanzhong       a d b c c d b d c b  luoguanzhong 99.99
tangyin            a b d a a a b b a b  tangyin     99.99
zhengbanqiao       a b d d a a c b a c  zhengbanqiao 99.99

=== 汇总 ===
理想路径 → 本人第一且 99.99：100/100
理想路径两两最少相差 2 题
穷举 1048576 组：可成为第一的人物 100/100；其中贴合度并列、靠特质余弦决胜的组合 371912；第一名最大占比 2.15%（shunzhi）；最小占比 0.144%
穷举最低第一名贴合度 = 0.4（score.ts MATCH_FLOOR = 0.4）
随机 3000 次（真实 calculateResult）：min 0.01 max 83.33 mean 33.12；出现过的第一名 100/100；最大占比 2.33%
匹配度 10 档直方图（0.01→99.99）：
  0.01–10.01     42  #
  10.01–20.01    432  ##############
  20.01–30.00    660  ######################
  30.00–40.00   1251  ##########################################
  40.00–50.00     43  #
  50.00–60.00    471  ################
  60.00–70.00     81  ###
  70.00–79.99     15  #
  79.99–89.99      5  
  89.99–99.99      0  

✓ 全部通过
