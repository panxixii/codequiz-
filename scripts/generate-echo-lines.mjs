import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 名言或正面评价：结果揭示动画第一幕 */
const ECHO = {
  libai: '天生我材必有用，千金散尽还复来。',
  dufu: '会当凌绝顶，一览众山小。',
  baijuyi: '野火烧不尽，春风吹又生。',
  wangwei: '行到水穷处，坐看云起时。',
  menghaoran: '春眠不觉晓，处处闻啼鸟。',
  sushi: '一蓑烟雨任平生。',
  liqingzhao: '生当作人杰，死亦为鬼雄。',
  xinqiji: '了却君王天下事，赢得生前身后名。',
  luyou: '位卑未敢忘忧国。',
  quyuan: '路漫漫其修远兮，吾将上下而求索。',
  taoyuanming: '采菊东篱下，悠然见南山。',
  caozhi: '本是同根生，相煎何太急。',
  nalanxingde: '人生若只如初见。',
  ouyangxiu: '醉翁之意不在酒，在乎山水之间也。',
  gongzizhen: '我劝天公重抖擞，不拘一格降人才。',
  lihe: '黑云压城城欲摧。',
  lishangyin: '春蚕到死丝方尽，蜡炬成灰泪始干。',
  gaoshi: '莫愁前路无知己，天下谁人不识君。',
  censhen: '忽如一夜春风来，千树万树梨花开。',
  wanganshi: '不畏浮云遮望眼，自缘身在最高层。',
  liuyuxi: '沉舟侧畔千帆过，病树前头万木春。',
  hezhang: '少小离家老大回，乡音无改鬓毛衰。',
  chenziang: '前不见古人，后不见来者。',
  wentingyun: '小山重叠金明灭，鬓云欲度香腮雪。',
  yanjidao: '落花人独立，微雨燕双飞。',
  jiangkui: '淮南皓月冷千山，冥冥归去无人管。',
  yuanzhen: '曾经沧海难为水，除却巫山不是云。',
  dumu: '商女不知亡国恨，隔江犹唱后庭花。',
  yangwanli: '小荷才露尖尖角，早有蜻蜓立上头。',
  fanchengda: '昼出耘田夜绩麻，村庄儿女各当家。',
  huangtingjian: '桃李春风一杯酒，江湖夜雨十年灯。',
  suqin: '衣带渐宽终不悔，为伊消得人憔悴。',
  liubang: '大风起兮云飞扬，威加海内兮归故乡。',
  liuche: '犯强汉者，虽远必诛。',
  liushimin: '以铜为镜，可以正衣冠；以人为镜，可以明得失。',
  wuzetian: '后人评她：敢于破局，亦能治国。',
  kangxi: '后人评他：勤政好学，开创百年基业。',
  yongzheng: '后人评他：冷面实干，事必躬亲。',
  qianlong: '后人评他：文治武功，极盛一时。',
  yingzheng: '后人评他：书同文，车同轨，一统天下。',
  liubei: '勿以恶小而为之，勿以善小而不为。',
  caocao: '老骥伏枥，志在千里。',
  zhaokuangyin: '后人评他：杯酒释兵权，以文治国。',
  zhuyuanzhang: '后人评他：从草莽到开国，励精图治。',
  yangjian: '后人评他：结束分裂，再造一统。',
  wenjing: '后人评他：与民休息，开启文景之治。',
  tangxuanzong: '后人评他：开元盛世，文采斐然。',
  yongle: '后人评他：迁都北京，派郑和远航。',
  shunzhi: '后人评他：性情真挚，承前启后。',
  liuxiu: '后人评他：光武中兴，重建秩序。',
  liangwu: '后人评他：崇文尚信，以文化人。',
  chongzhen: '后人评他：勤勉不息，欲挽狂澜。',
  wuwang: '后人评他：吊民伐罪，建立新秩序。',
  zhangzuehou: '后人评她：贤德内助，善于劝谏。',
  lvzhi: '后人评她：铁腕主政，掌控全局。',
  cixi: '后人评她：权谋深远，执掌朝局数十年。',
  liuche2: '后人评他：削藩定策，稳中求进。',
  zhuge: '鞠躬尽瘁，死而后已。',
  wangyangming: '此心光明，亦复何言。',
  xuanzang: '后人评他：万里取经，矢志不渝。',
  wangxizhi: '后人评他：书圣风骨，天下第一行书。',
  banzhao: '后人评她：博学传灯，成一家之言。',
  kongzi: '己所不欲，勿施于人。',
  laozi: '上善若水，水善利万物而不争。',
  zhuangzi: '鹏之徙于南冥也，水击三千里。',
  mozi: '兼相爱，交相利。',
  sunwu: '知彼知己，百战不殆。',
  hanxin: '后人评他：连百万之军，战必胜，攻必取。',
  yuefei: '靖康耻，犹未雪；臣子恨，何时灭。',
  zhenghe: '后人评他：七下西洋，扬帆万里。',
  zhangqian: '后人评他：凿空西域，开辟丝路。',
  simaqian: '人固有一死，或重于泰山，或轻于鸿毛。',
  lishizhen: '后人评他：本草求真，利济苍生。',
  zhangheng: '后人评他：通天地人，精于制作。',
  zuchongzhi: '后人评他：精算圆周，冠绝一时。',
  shenkuo: '后人评他：博学多识，格物致知。',
  cailun: '后人评他：改良造纸，惠及万世。',
  bisheng: '后人评他：活字印刷，传播文明。',
  luban: '后人评他：匠心独运，百工之祖。',
  huatuo: '后人评他：医术通神，济世活人。',
  simaguang: '后人评他：资治通鉴，以史为镜。',
  zhuxi: '问渠那得清如许？为有源头活水来。',
  guyanwu: '天下兴亡，匹夫有责。',
  huangzongxi: '后人评他：思想破冰，经世致用。',
  xunxiaoke: '后人评他：踏遍山河，以足为笔。',
  jianzhen: '后人评他：六次东渡，矢志不移。',
  banchao: '不入虎穴，焉得虎子。',
  weizhongxian_skip: '后人评他：铁面无私，正气凛然。',
  hairui: '后人评他：清廉刚直，直言敢谏。',
  linzexu: '苟利国家生死以，岂因祸福避趋之。',
  zhangjuzheng: '后人评他：考成变法，整顿纲纪。',
  guanZhong: '仓廪实而知礼节，衣食足而知荣辱。',
  shangyang: '后人评他：法令如山，锐意变法。',
  qinguan: '两情若是久长时，又岂在朝朝暮暮。',
  xinqiji2: '问君能有几多愁？恰似一江春水向东流。',
  caoxueqin: '满纸荒唐言，一把辛酸泪。',
  wuchengen: '后人评他：神魔奇想，家喻户晓。',
  luoguanzhong: '后人评他：演义三国，英雄入人心。',
  tangyin: '他人笑我太疯癫，我笑他人看不穿。',
  zhengbanqiao: '难得糊涂。',
}

const ids = Object.keys(ECHO)
const lines = []
lines.push(`import type { FigureId } from './figures'`)
lines.push('')
lines.push(`/** 人物名言或正面评价：结果揭示动画第一幕 */`)
lines.push(`export const ECHO_LINES: Record<FigureId, string> = {`)
for (const id of ids) {
  lines.push(`  ${id}: '${ECHO[id].replace(/'/g, "\\'")}',`)
}
lines.push(`}`)
lines.push('')
lines.push(`export function getEchoLine(figureId: FigureId): string {`)
lines.push(`  return ECHO_LINES[figureId]`)
lines.push(`}`)
lines.push('')

const out = path.join(__dirname, '../src/data/echoLines.ts')
fs.writeFileSync(out, lines.join('\n'), 'utf8')
console.log(`Wrote ${ids.length} echo lines -> ${out}`)
