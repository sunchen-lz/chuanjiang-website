export const knowledge = [
  { id:'ecosystem',type:'合作生态',title:'高校与科技企业合作网络',summary:'与四川大学、电子科技大学、成都理工大学、西南医科大学等高校及其重点实验室，以及华为、百度、阿里、讯飞等头部企业达成深度合作。',source:'企业宣传片 · 创新与合作',href:'#/about',keywords:'合作 高校 大学 实验室 华为 百度 阿里 讯飞 科研 生态'},
  { id:'network',type:'研究院布局',title:'立足川南渝西，辐射西南，面向全国',summary:'按照“一院强核、多司支撑、产业孵化、要地网链”的思路，在成都、重庆、西藏、海南等重要城市及地区设立分支机构，在多地参控股专业性公司。',source:'企业宣传片 · 产业与布局',href:'#/about',keywords:'分支 机构 布局 成都 重庆 西藏 海南 区域 全国 发展'},
  { id:'applications',type:'行业应用',title:'专业智能体与 AI 行业应用进展',summary:'以 AI 要素先进平台为核心，打造工格办公、康小和、智小达、泸小智（酒城智枢）等专业智能体，已在众多政企单位和部分医养机构得到有效应用。',source:'企业宣传片 · AI 行业应用',href:'#/solutions',keywords:'应用 落地 实践 行业 政企 医养 智能体'},
  { id:'film',type:'品牌影像',title:'川江奔涌，向新而行 · 企业宣传片',summary:'观看约 3 分 41 秒企业宣传片，了解研究院的创新合作、产业布局、AI 行业应用与发展方向；提供章节定位与文字介绍。',source:'企业宣传片 · 完整视频',href:'#/resources',keywords:'宣传片 视频 影像 品牌 介绍 故事'},
  { id:'platform',type:'平台与服务',title:'AI 要素先进平台与行业应用',summary:'以人工智能研发和服务为核心，连接政企服务、智慧医养、智慧教育和数字文化。',source:'企业宣传片',href:'#/products',keywords:'AI 人工智能 平台 研发 服务 智能体 集成'},
  { id:'gongge',type:'产品资料',title:'工格办公 · 政企协作',summary:'从办公和组织协作场景出发，探索人工智能与业务流程的融合。具体功能与适用版本以正式产品说明为准。',source:'宣传片产品介绍 / 界面场景创作',href:'#/products?product=gongge',keywords:'办公 政企 协作 组织 工格'},
  { id:'kang',type:'产品资料',title:'康小和 · 智慧医养',summary:'面向医康养服务场景的智能应用方向，连接真实服务需要。',source:'宣传片产品介绍',href:'#/products?product=kang',keywords:'康小和 医养 医疗 养老 健康 服务'},
  { id:'zhi',type:'产品资料',title:'智小达 · 智慧教育',summary:'围绕课堂、校园与成长场景探索数智应用。',source:'宣传片产品介绍',href:'#/products?product=zhi',keywords:'智小达 教育 学校 校园 教学'},
  { id:'lu',type:'产品资料',title:'泸小智 · 酒城智枢',summary:'数字文化与城市智能体方向，连接城市语境和应用场景。',source:'宣传片产品介绍',href:'#/products?product=lu',keywords:'泸小智 酒城 城市 文旅 数字文化'},
  { id:'research',type:'服务能力',title:'从技术研发到成果转化',summary:'研究机构 + 天使投资 + 创新平台 + 产业孵化，开展应用集成、大数据、物联网、5G、人才培育及技术转移转化。',source:'2026.1 川江科技研究院介绍',href:'#/about',keywords:'研究 研发 大数据 物联网 5G 孵化 成果转化 合作'},
  { id:'trial',type:'技术问答',title:'如何下载和申请试用？',summary:'当前可下载四产品 HTML 界面体验包，正式软件安装包尚未提供。可填写试用申请，版本与系统要求待发布说明。',source:'本轮 DEMO 试用说明',href:'#/downloads',keywords:'下载 试用 版本 安装 软件 系统'},
  { id:'support',type:'技术问答',title:'问题提交后如何跟进？',summary:'在服务支持提交测试反馈后，通过反馈记录查看状态与回复。DEMO 仅保存在本浏览器，不发送给研究院。',source:'本轮 DEMO 服务说明',href:'#/support',keywords:'问题 反馈 回复 售后 支持'},
];

export function searchKnowledge(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return knowledge;
  return knowledge.map(item => ({item,score:[item.title,item.summary,item.keywords].reduce((score,text) => score + (text.toLowerCase().includes(q) ? 4 : [...q].filter(c => /[\u4e00-\u9fff]/.test(c) && text.includes(c)).length*.2),0)})).filter(hit => hit.score > .4).sort((a,b) => b.score-a.score).map(hit => hit.item);
}

export type Lead = {id:string;name:string;company:string;contact:string;need:string;date:string;slot:string;status:string;note:string;createdAt:string};
export const leadKey = 'chuanjiang-leads-demo-v3';
export function readLeads(): Lead[] {
  try { const value = JSON.parse(localStorage.getItem(leadKey) || '[]'); return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.need === 'string').slice(0,100) : []; } catch { return []; }
}
export function writeLeads(items:Lead[]) {localStorage.setItem(leadKey,JSON.stringify(items));window.dispatchEvent(new Event('chuanjiang:leads-changed'));}
