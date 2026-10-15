import { useEffect, useState } from 'react';

export default function RequestBrief() {
  const [inquiry, setInquiry] = useState('');
  const [status, setStatus] = useState('先整理想法，再开始一场对话。');
  const [error, setError] = useState(false);

  useEffect(() => {
    const receive = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      setInquiry(text);
      setStatus('已带入你感兴趣的方向，继续写下具体需求。');
      setError(false);
    };
    window.addEventListener('chuanjiang:inquiry', receive);
    return () => window.removeEventListener('chuanjiang:inquiry', receive);
  }, []);

  function summary() {
    return `致四川川江科技研究院\n\n我正在思考的事：\n${inquiry.trim()}\n\n期待与你一起讨论可行的下一步。`;
  }

  async function copy() {
    if (!inquiry.trim()) {
      setError(true);
      setStatus('请先写下一句正在思考的话。');
      document.getElementById('inquiry')?.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(summary());
      setStatus('摘要已复制，可粘贴到你与我们沟通的渠道。');
      setError(false);
    } catch {
      setStatus('浏览器暂不允许复制，可以下载摘要。');
      setError(false);
    }
  }

  function download() {
    if (!inquiry.trim()) {
      setError(true);
      setStatus('请先写下一句正在思考的话。');
      document.getElementById('inquiry')?.focus();
      return;
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF' + summary()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '川江科技研究院-需求摘要.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('摘要已下载，方便你随时继续这场对话。');
    setError(false);
  }

  return (
    <div className="brief-form">
      <div className="brief-label-row">
        <label className="contact-label" htmlFor="inquiry">正在思考的事</label>
        <span className="brief-count" aria-hidden="true">{inquiry.length} / 500</span>
      </div>
      <textarea
        id="inquiry"
        maxLength={500}
        value={inquiry}
        onChange={(event) => { setInquiry(event.target.value); setError(false); }}
        aria-describedby="brief-status brief-note"
        aria-invalid={error}
        placeholder="例如：我们想从客户对话中，找到服务可以改进的地方……"
      />
      <div className="contact-action">
        <button className="button button-light" type="button" onClick={copy}>复制需求摘要 <span aria-hidden="true">↗</span></button>
        <button className="download-brief" type="button" onClick={download}>下载摘要 ↓</button>
      </div>
      <p id="brief-status" className={error ? 'brief-status error' : 'brief-status'} role="status" aria-live="polite">{status}</p>
      <p id="brief-note" className="brief-note">内容保留在当前页面，复制和下载均不会提交需求。</p>
    </div>
  );
}
