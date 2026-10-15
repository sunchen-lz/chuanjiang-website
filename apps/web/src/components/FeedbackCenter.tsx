import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { products } from '../data/products';

type Status = '待处理' | '处理中' | '已回复';
type Ticket = { id: string; product: string; type: string; title: string; description: string; contact: string; createdAt: string; status: Status; reply: string; updatedAt: string; sample?: boolean };
const key = 'chuanjiang-feedback-demo-v2';
const changed = 'chuanjiang:feedback-changed';
const types = ['使用问题', '试用申请', '功能建议', '合作咨询'];
const sampleTickets: Ticket[] = [
  { id: 'DEMO-002', product: '康小和', type: '试用申请', title: '希望了解医养场景的试用方式', description: '这是一条演示记录，用于查看反馈详情与处理状态。可以尝试填写回复并保存。', contact: '演示数据，无真实联系人', createdAt: '2026-10-15T02:20:00Z', status: '待处理', reply: '', updatedAt: '2026-10-15T02:20:00Z', sample: true },
  { id: 'DEMO-001', product: '工格办公', type: '功能建议', title: '建议增加常用场景入口', description: '这是一条演示记录。希望可以在工作台快速找到常用的办公场景。', contact: '演示数据，无真实联系人', createdAt: '2026-10-15T01:05:00Z', status: '已回复', reply: '演示回复：已记录该建议，感谢你帮助我们完善体验。', updatedAt: '2026-10-15T01:30:00Z', sample: true },
];

function read(): Ticket[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return sampleTickets;
    const data: unknown = JSON.parse(stored);
    if (!Array.isArray(data)) return sampleTickets;
    return data.filter((item): item is Ticket => item && typeof item.id === 'string' && typeof item.product === 'string' && typeof item.title === 'string' && typeof item.description === 'string' && typeof item.contact === 'string' && typeof item.type === 'string' && typeof item.reply === 'string' && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string' && ['待处理', '处理中', '已回复'].includes(item.status)).slice(0, 100);
  } catch { return sampleTickets; }
}

function write(tickets: Ticket[]) {
  localStorage.setItem(key, JSON.stringify(tickets));
  window.dispatchEvent(new Event(changed));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function FeedbackCenter({ mode }: { mode: 'public' | 'admin' }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [product, setProduct] = useState('工格办公');
  const [type, setType] = useState('使用问题');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<Status>('待处理');
  const selected = tickets.find(ticket => ticket.id === selectedId);
  const filtered = useMemo(() => tickets.filter(ticket => (filter === '全部' || ticket.status === filter) && `${ticket.id} ${ticket.title} ${ticket.product}`.toLowerCase().includes(search.toLowerCase())), [tickets, filter, search]);

  useEffect(() => {
    const sync = () => setTickets(read());
    const route = () => {
      if (mode !== 'public' || !location.hash.startsWith('#/support')) return;
      const params = new URLSearchParams(location.hash.split('?')[1]);
      const item = products.find(item => item.id === params.get('product'));
      if (item) setProduct(item.name);
      const intent = params.get('type');
      if (intent === 'trial') setType('试用申请');
      else if (intent === 'consult') setType('合作咨询');
      setTab('form'); setNotice('');
    };
    sync(); route();
    window.addEventListener(changed, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('hashchange', route);
    return () => { window.removeEventListener(changed, sync); window.removeEventListener('storage', sync); window.removeEventListener('hashchange', route); };
  }, [mode]);

  useEffect(() => {
    if (!selectedId && tickets[0]) setSelectedId(tickets[0].id);
    if (selected) { setReply(selected.reply); setStatus(selected.status); }
  }, [tickets, selectedId]);

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) { setError(true); setNotice('请填写问题标题与具体描述。'); return; }
    const existing = read();
    if (existing.length >= 100) { setError(true); setNotice('本地演示记录已达到 100 条，请在新的浏览器配置中继续体验。'); return; }
    const now = new Date().toISOString();
    const id = `CJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const ticket: Ticket = { id, product, type, title: title.trim(), description: description.trim(), contact: contact.trim(), createdAt: now, updatedAt: now, status: '待处理', reply: '' };
    try {
      write([ticket, ...existing]); setError(false); setSelectedId(id); setTab('history');
      setNotice(`已保存演示反馈，编号 ${id}。可在反馈处理台体验回复。`);
      setTitle(''); setDescription(''); setContact('');
    } catch { setError(true); setNotice('浏览器未允许本地保存，反馈没有保存成功。请允许站点存储后重试。'); }
  }

  function save() {
    if (!selected) return;
    if (status === '已回复' && !reply.trim()) { setError(true); setNotice('请填写回复内容后再标记为“已回复”。'); return; }
    try {
      const next = read().map(ticket => ticket.id === selected.id ? { ...ticket, status, reply: reply.trim(), updatedAt: new Date().toISOString() } : ticket);
      write(next); setError(false); setNotice('处理结果已保存，用户反馈记录已同步更新。');
    } catch { setError(true); setNotice('本地保存失败，请允许浏览器存储后重试。'); }
  }

  const badge = (ticket: Ticket) => <span className={`ticket-badge status-${ticket.status === '待处理' ? 'new' : ticket.status === '处理中' ? 'progress' : 'done'}`}>{ticket.status}</span>;

  if (mode === 'admin') return <div className="admin-workspace">
    <div className="demo-notice"><span>DEMO</span><p>当前处理台仅访问本浏览器的演示记录，支持同源标签页实时同步。正式后台将接入服务端、登录与权限管理。</p></div>
    <div className="admin-stats">{['全部', '待处理', '处理中', '已回复'].map(item => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}><span>{item === '全部' ? '全部反馈' : item}</span><strong>{item === '全部' ? tickets.length : tickets.filter(ticket => ticket.status === item).length}</strong><small>{item === '全部' ? '含演示样例' : '查看记录 →'}</small></button>)}</div>
    <div className="admin-toolbar"><h2>反馈收件箱 <span>{filtered.length}</span></h2><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索标题、产品或编号" aria-label="搜索反馈" /></div>
    <div className="admin-columns"><div className="ticket-list">{filtered.length === 0 ? <p className="empty-state">没有符合条件的反馈。</p> : filtered.map(ticket => <button type="button" key={ticket.id} onClick={() => { setSelectedId(ticket.id); setNotice(''); }} className={`ticket-list-item ${selectedId === ticket.id ? 'active' : ''}`}><span className="ticket-list-meta"><small>{ticket.product} · {ticket.type}</small>{badge(ticket)}</span><strong>{ticket.title}</strong><span className="ticket-list-date">{ticket.sample ? '演示样例' : ticket.id} <time>{formatDate(ticket.createdAt)}</time></span></button>)}</div><div className="ticket-detail">{selected ? <><div className="ticket-detail-top"><span className="eyebrow">{selected.id}{selected.sample ? ' / 演示样例' : ''}</span>{badge(selected)}</div><h2>{selected.title}</h2><p className="ticket-detail-meta">{selected.product} · {selected.type} · {formatDate(selected.createdAt)}</p><p className="ticket-description">{selected.description}</p><div className="ticket-contact"><span>联系方式</span><p>{selected.contact || '未提供'}</p></div><div className="reply-form"><label htmlFor="adminStatus">处理状态</label><select id="adminStatus" value={status} onChange={event => setStatus(event.target.value as Status)}><option>待处理</option><option>处理中</option><option>已回复</option></select><label htmlFor="adminReply">回复与处理说明</label><textarea id="adminReply" value={reply} onChange={event => setReply(event.target.value)} maxLength={2000} placeholder="填写用户可以在反馈记录中看到的回复…" rows={5} /><div className="reply-actions"><small>保存后同步至用户反馈记录</small><button type="button" className="button button-blue" onClick={save}>保存处理结果 <span>✓</span></button></div></div></> : <p className="empty-state">选择一条反馈查看详情。</p>}</div></div>
    {notice && <p className={`feedback-notice ${error ? 'error' : ''}`} role="status">{notice}</p>}
  </div>;

  return <div className="feedback-center">
    <div className="feedback-tabs" role="tablist" aria-label="反馈服务"><button type="button" role="tab" aria-selected={tab === 'form'} onClick={() => setTab('form')}>提交反馈 <span>↗</span></button><button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>反馈记录 <span>{tickets.filter(ticket => !ticket.sample).length}</span></button></div>
    <div className="demo-notice"><span>DEMO</span><p>提交仅保存于当前浏览器，用于评审反馈与处理流程，不会发送给研究院。<a href="#/admin">体验反馈处理台 ↗</a></p></div>
    {notice && <p className={`feedback-notice ${error ? 'error' : ''}`} role="status">{notice}</p>}
    {tab === 'form' ? <form onSubmit={submit} className="feedback-form"><div className="form-row"><div><label htmlFor="feedbackProduct">相关产品</label><select id="feedbackProduct" value={product} onChange={event => setProduct(event.target.value)}>{products.map(item => <option key={item.id}>{item.name}</option>)}<option>其他 / 研究院合作</option></select></div><div><label htmlFor="feedbackType">问题类型</label><select id="feedbackType" value={type} onChange={event => setType(event.target.value)}>{types.map(item => <option key={item}>{item}</option>)}</select></div></div><label htmlFor="feedbackTitle">问题标题 <b>*</b></label><input id="feedbackTitle" required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="用一句话概括你想反馈的问题" /><label htmlFor="feedbackDescription">具体描述 <b>*</b><small>{description.length} / 2000</small></label><textarea id="feedbackDescription" required maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} placeholder="可以描述使用场景、遇到的问题，以及你期望的结果…" rows={5} /><label htmlFor="feedbackContact">联系方式 <span>选填</span></label><input id="feedbackContact" maxLength={120} value={contact} onChange={event => setContact(event.target.value)} placeholder="正式服务可用于后续联系；DEMO 建议使用测试信息" /><div className="form-submit"><small>带着一个问题，就可以开始。</small><button className="button button-blue" type="submit">提交演示反馈 <span>↗</span></button></div></form> : <div className="public-history"><div className="history-head"><h3>本浏览器反馈记录</h3><a href="#/admin">打开处理台 ↗</a></div>{tickets.filter(ticket => !ticket.sample).length === 0 ? <div className="empty-state"><span>⌁</span><h3>还没有提交反馈</h3><p>你的问题与处理进展会显示在这里。</p><button type="button" className="text-link" onClick={() => setTab('form')}>提出第一个问题 →</button></div> : tickets.filter(ticket => !ticket.sample).map(ticket => <article className="public-ticket" key={ticket.id}><div className="ticket-detail-top"><small>{ticket.id}</small>{badge(ticket)}</div><h3>{ticket.title}</h3><p>{ticket.description}</p><div className="public-ticket-meta">{ticket.product} · {ticket.type}<time>{formatDate(ticket.createdAt)}</time></div>{ticket.reply && <div className="public-reply"><strong>处理回复 <time>{formatDate(ticket.updatedAt)}</time></strong><p>{ticket.reply}</p></div>}</article>)}</div>}
  </div>;
}
