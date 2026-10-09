// This controller owns contact context and intent. site.js owns all copy actions.
const contact = document.querySelector('[data-contact-intents]');
if (contact) {
  const tasks = new Map([...contact.querySelectorAll('[data-contact-task]')].map(card => [card.dataset.contactTask, {
    card,
    button: card.querySelector('[data-contact-intent]'),
    title: card.querySelector('[data-contact-task-title]').textContent,
    opening: card.dataset.contactOpening,
    scope: card.dataset.contactScope,
  }]));
  const workContexts = {
    'field-fuli': { title: '奶奶的蕾丝', intent: 'space' },
    fuli: { title: '奶奶的蕾丝', intent: 'space' },
    'field-shanyao': { title: '山窑麦叙', intent: 'space' },
    shanyao: { title: '山窑麦叙', intent: 'space' },
    'field-materials': { title: '亲子场地策划', intent: 'space' },
    'field-soho': { title: 'SOHO3Q 活动', intent: 'event' },
    soho: { title: '公众号内容', intent: 'event' },
    hroot: { title: 'HRoot 原创内容与活动', intent: 'event' },
    'hroot-transcript': { title: '演讲内容编辑', intent: 'event' },
    shiseido: { title: '资生堂文案', intent: 'writing' },
    'estee-lauder': { title: '雅诗兰黛文案', intent: 'writing' },
    'tea-pi': { title: '茶π标题', intent: 'writing' },
    'grain-and-fire': { title: '品牌故事', intent: 'writing' },
    'hroot-communication': { title: '原创文章', intent: 'writing' },
  };
  const origin = contact.querySelector('[data-contact-origin]');
  const copy = contact.querySelector('[data-contact-draft-copy]');
  const preview = contact.querySelector('[data-copy-preview]');
  const mails = contact.querySelectorAll('[data-contact-mailto],[data-contact-native="email"]');
  const email = contact.dataset.contactEmail;

  function restoreContact() {
    const params = new URLSearchParams(location.search);
    const workId = params.get('work');
    const work = Object.hasOwn(workContexts, workId) ? workContexts[workId] : undefined;
    const explicitIntent = params.get('intent');
    const selected = tasks.has(explicitIntent) ? explicitIntent : work?.intent || '';
    const task = tasks.get(selected);

    for (const [id, item] of tasks) {
      const active = id === selected;
      item.button.setAttribute('aria-pressed', String(active));
      item.card.classList.toggle('is-selected', active);
    }
    origin.hidden = !work && !task;
    origin.textContent = work ? `从「${work.title}」聊起${task ? ` · ${task.title}` : ''}。` : task ? `沟通方向：${task.title}` : '';
    const introduction = `Echo 你好，${work ? `看了你的「${work.title}」，` : ''}${task ? task.opening : '有件事想和你聊聊'}。`;
    const message = [introduction, task?.scope, '目前的进展：', '想一起解决的问题：'].filter(Boolean).join('\n');
    const subject = task ? `聊聊${task.title}` : work ? `项目沟通 · ${work.title}` : '项目沟通 · Echo';
    copy.dataset.copy = message;
    preview.textContent = message;
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    mails.forEach(mail => mail.href = mailto);
    contact.dataset.contactIntent = selected;
    contact.dataset.contactWork = work ? workId : '';
    const status = contact.querySelector('#copy-status');
    if (status) status.textContent = '';
  }

  for (const [id, item] of tasks) {
    item.card.querySelector('[data-contact-task-title]').hidden = true;
    item.button.hidden = false;
    item.button.addEventListener('click', () => {
      // Clicking the current choice does not add a duplicate browser-history entry.
      if (contact.dataset.contactIntent === id) return;
      const url = new URL(location.href);
      url.searchParams.set('intent', id);
      history.pushState({ ...(history.state || {}), contactIntent: id }, '', `${url.pathname}${url.search}${url.hash}`);
      restoreContact();
    });
  }
  contact.querySelector('[data-contact-choice-note]').hidden = false;
  contact.querySelector('[data-contact-context]').hidden = false;
  restoreContact();
  contact.dataset.contactReady = 'true';
  addEventListener('popstate', restoreContact);
  addEventListener('pageshow', restoreContact);
}
