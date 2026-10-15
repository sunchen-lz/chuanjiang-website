import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(workspace, 'apps', 'web');
const resolveAstro = createRequire(realpathSync(path.join(web, 'node_modules', 'astro', 'package.json')));
const { build } = await import(pathToFileURL(resolveAstro.resolve('vite')).href);
const folder = '四川川江科技研究院-界面DEMO-V7-20261015';
const destination = path.join(workspace, '交付', folder);

const result = await build({
  configFile: false, root: web, publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { write: false, target: 'es2020', minify: true, lib: {
    entry: path.join(workspace, 'scripts', 'preview-entry.ts'),
    name: 'ChuanjiangPreview', formats: ['iife'], fileName: 'preview',
  } },
});
const bundle = (Array.isArray(result) ? result.flatMap(item => item.output) : result.output)
  .find(item => item.type === 'chunk' && item.isEntry);
if (!bundle) throw new Error('Preview JavaScript bundle was not generated.');

const client = path.join(web, 'dist', 'client');
let html = await fs.readFile(path.join(client, 'index.html'), 'utf8');
const cssMatch = html.match(/<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>/);
if (!cssMatch) throw new Error('Built stylesheet was not found. Run pnpm build first.');
const css = await fs.readFile(path.join(client, cssMatch[1].replace(/^\//, '')), 'utf8');
const logo = await fs.readFile(path.join(client, 'brand', 'logo.png'));
const logoUrl = `data:image/png;base64,${logo.toString('base64')}`;
const experience = await fs.readFile(path.join(client, 'downloads', '川江产品界面体验包.html'));
const experienceUrl = `data:text/html;charset=utf-8;base64,${experience.toString('base64')}`;
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
html = html.replace(cssMatch[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
html = html.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" type="image/png" href="${logoUrl}">`);
html = html.replaceAll('src="/brand/logo.png"', `src="${logoUrl}"`);
await fs.mkdir(path.join(destination, '品牌素材', '产品标识'), { recursive: true });
for (const id of ['gongge', 'kang', 'zhi', 'lu']) {
  const mark = await fs.readFile(path.join(client, 'media', 'product-logos', id + '.png'));
  html = html.replaceAll('/media/product-logos/' + id + '.png', 'data:image/png;base64,' + mark.toString('base64'));
  await fs.writeFile(path.join(destination, '品牌素材', '产品标识', id + '.png'), mark);
}
await fs.copyFile(path.join(client, 'media', 'product-logos', 'source.json'), path.join(destination, '品牌素材', '产品标识', 'source.json'));
const media = [['chuanjiang-brand-film.mp4', '川江科技研究院宣传片.mp4'], ['chuanjiang-film-poster.jpg', '宣传片封面.jpg']];
await fs.mkdir(path.join(destination, '品牌素材'), { recursive: true });
for (const [source, name] of media) {
  html = html.replaceAll(`/media/${source}`, `品牌素材/${name}`);
  await fs.copyFile(path.join(client, 'media', source), path.join(destination, '品牌素材', name));
}
html = html.replace(/<astro-island\b[^>]*>([\s\S]*?)<\/astro-island>/g,
  (_, content) => content.replaceAll('<!--astro:end-->', ''));
html = html.replaceAll('href="/downloads/川江产品界面体验包.html"', `href="${experienceUrl}"`);
html = html.replace(/(<a\b[^>]*\bid="downloadDemo"[^>]*?)\sdownload(?:="[^"]*")?(?=[\s>])/, '$1 download="川江产品界面体验包.html"');
html = html.replace('</body>', () => `<script>${bundle.code.replace(/<\/script/gi, '<\\/script')}</script></body>`);
if (/<script[^>]+src=|<link[^>]+href="\/(?:_astro|brand)|(?:component-url|renderer-url)=|<astro-island\b|(?:src|href|poster)="\/(?:downloads|brand|media)\//.test(html)) {
  throw new Error('Standalone preview still references a separate runtime asset.');
}
await fs.mkdir(path.join(destination, '预览截图'), { recursive: true });
await fs.mkdir(path.join(destination, '下载体验'), { recursive: true });
await fs.writeFile(path.join(destination, '双击打开试看.html'), html);
await fs.copyFile(path.join(client, 'downloads', '川江产品界面体验包.html'), path.join(destination, '下载体验', '川江产品界面体验包.html'));
const screenshots = ['首页-电脑.png', '首页-全页.png', '首页-手机首屏.png', 'home-手机.png', '产品-电脑.png', '下载中心-电脑.png', '服务支持-电脑.png', '反馈处理台-电脑.png', '智能搜索-电脑.png', 'AI咨询-电脑.png', '需求预约-电脑.png', '运营工作台-电脑.png', '服务资料-电脑.png', '宣传片-电脑.png', '宣传片-手机.png', '关于川江-合作生态.png', '连接图-1440.png', '连接图-591.png', '连接图-390.png', '连接图-320.png'];
for (const name of screenshots) await fs.copyFile(path.join(workspace, 'docs', 'screenshots-v7', name), path.join(destination, '预览截图', name));
const guide = await fs.readFile(path.join(workspace, 'docs', '客户设计导览-V7.html'), 'utf8');
await fs.writeFile(path.join(destination, '设计思路与灵感.html'), guide.replaceAll('screenshots-v7/', '预览截图/'));
await fs.copyFile(path.join(workspace,'docs','技术功能与界面入口-V7.md'),path.join(destination,'技术功能与界面入口.md'));
await fs.copyFile(path.join(workspace,'docs','素材更新说明-V7.md'),path.join(destination,'素材更新说明.md'));
try { await fs.copyFile(path.join(workspace, 'docs', '设计思路与灵感-V7.pdf'), path.join(destination, '设计思路与灵感.pdf')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

const instructions = `四川川江科技研究院｜界面 DEMO V7 · 透明标识与连接图精修
懂场景，更懂下一步。 · 2026 年 10 月 15 日

【打开方式】
1. 解压整个压缩包，保留目录结构。
2. 用 Edge 或 Chrome 双击打开“双击打开试看.html”。
3. 无需联网、安装或启动服务。建议先用电脑试看，再调整窗口查看移动布局。

【建议体验】
1. 首页：以 V1 的饱和度为基准，统一深青墨、水青、暖金与浅米。去掉 LOGO 白底并降低对比；水域扩大至首屏下半部，山以远近淡墨层次出现；无需声音持续流动。
2. 四款产品接入宣传片中的真实标识；首页节点、产品卡、产品页、工作台和下载中心统一展示。连接图采用玉青透镜核心、细环刻度、定向流光与玻璃卡片；悬停或键盘聚焦时，对应连线与说明同步响应。四款标识去掉白色托盘，直接融入背景。水波粒子增加并随连续流线运动。点击首屏产品节点或产品卡，切换工格办公、康小和、智小达、泸小智。
3. 首页切换行业或选择关注方向，查看对应产品入口与场景概念。
4. 下载中心：点击“下载界面体验包”，打开下载的 HTML，切换产品并下载体验摘要。
5. 服务与支持：填写一条测试反馈，提交后查看反馈编号与状态。
6. 点“体验反馈处理台”：选中刚提交的记录，填回复、改为“已回复”并保存。
7. 返回服务与支持的“反馈记录”，查看回复；刷新后记录仍保留在本浏览器。
8. 首页、关于川江或服务与资料：点击“观看川江宣传片”，播放完整企业宣传片，支持章节跳转和文字介绍。关闭后暂停，重新打开可继续播放。
9. 关于川江：查看企业概况、孵化企业、高校及科技企业合作、区域布局和行业应用进展。
10. 智能服务：搜索“医养”“高校”或“西藏”，查看公开资料；在 AI 咨询输入问题，查看规则演示回应、引用和建议图示。
11. 将咨询带入“需求与预约”，下载摘要；填写测试信息与意向时间，保存本地演示需求。
12. 页脚进入运营工作台：查看来源样例、本地线索、完整度规则、商机跟进和结果；切换内容审批、发布与索引状态以及运行监控。

【一起附上的内容】
- 设计思路与灵感.pdf：适合直接阅读、转发或会议评审。
- 设计思路与灵感.html：同版浏览器导览，可点击截图放大。
- 预览截图：电脑与手机页面。
- 下载体验：可独立打开的四产品概念工作台。
- 技术功能与界面入口.md：逐项对照已确定的技术架构，说明界面入口和上线实施范围。
- 品牌素材：完整企业宣传片、原片画面封面及四款产品裁切标识；请勿只转发主 HTML，必须保留此文件夹。
- 素材更新说明.md：此次补齐的内容及仍需业务补充的资料。

【DEMO 说明】
正式试用软件暂未提供，因此这里提供的是界面体验包，不是正式安装程序。
产品工作台为概念示意，咨询基于本地公开资料与规则，没有接入真实 AI、语义检索或模型服务。
反馈处理台演示提交、查看、分类及回复流程；数据只存在当前浏览器，不发送给研究院。
正式上线时再接入后台、登录权限、实时反馈服务及正式软件版本。
需求与预约只保存本地演示线索；意向时段不代表实际预约成功。运营统计与监控指标为标注的样例，未采集真实访问或连接外部 CRM。
麦克风只是可选的动效增强；浏览器不允许使用时，自动流动不受影响。
若浏览器开启“减少动态效果”，首屏将呈现静态画面。

【评审重点】
品牌气质、传统与科技的比例、产品和业务表达、首页与内页协调性、下载与反馈路径。
`;
await fs.writeFile(path.join(destination, '请先阅读.txt'), '\uFEFF' + instructions.replaceAll('\n', '\r\n'));
console.log(JSON.stringify({ folder: destination, standaloneBytes: Buffer.byteLength(html), pages: 10, screenshots: screenshots.length, offline: true }, null, 2));
