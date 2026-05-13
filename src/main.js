const STORAGE_KEY = 'baseball-dispatch-board:v3';

const defaultPlayers = [
  { id: 'p01', name: '山田 春陽', grade: '6年 | 1' },
  { id: 'p02', name: '北村 悠隼', grade: '6年 | 2' },
  { id: 'p03', name: '荻野 航', grade: '6年 | 10' },
  { id: 'p04', name: '岸 奏助', grade: '5年 | 3' },
  { id: 'p05', name: '沖野 結基', grade: '5年 | 4' },
  { id: 'p06', name: '石川 絢太', grade: '5年 | 5' },
  { id: 'p07', name: '真田 陸翔', grade: '5年 | 6' },
  { id: 'p08', name: '浅野 竜ノ介', grade: '5年 | 7' },
  { id: 'p09', name: '長島 幸太郎', grade: '5年 | 8' },
  { id: 'p10', name: '本澤 高之', grade: '5年 | 9' },
  { id: 'p11', name: '越水 奏太', grade: '5年 | 12' },
  { id: 'p12', name: '白川 海玲', grade: '5年 | 13' },
];

const seedDates = [
  '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06',
  '2026-05-09', '2026-05-10', '2026-05-16', '2026-05-17', '2026-05-23',
  '2026-05-24', '2026-05-30', '2026-05-31',
];

const seedParticipation = {
  p01: ['yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p02: ['yes', 'yes', 'yes', 'no', 'no', 'no', 'yes', 'yes', 'no', 'no', 'yes', 'yes', 'yes'],
  p03: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes'],
  p04: ['no', 'no', 'no', 'no', 'no', 'no', 'no', 'no', 'no', 'yes', 'yes', 'yes', 'yes'],
  p05: ['no', 'yes', 'yes', 'yes', 'yes', 'unknown', 'no', 'yes', 'yes', 'yes', 'yes', 'no', 'no'],
  p06: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p07: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p08: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p09: ['yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p10: ['yes', 'yes', 'no', 'yes', 'yes', 'unknown', 'yes', 'unknown', 'yes', 'yes', 'yes', 'unknown', 'yes'],
  p11: ['yes', 'unknown', 'no', 'unknown', 'yes', 'yes', 'no', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  p12: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
};

const participationLabels = {
  yes: '出席',
  no: '欠席',
  unknown: '未定',
};

const statusLabels = {
  shortage: '不足',
  exact: 'OK',
  surplus: 'OK',
};

const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];

let state = loadBoardState();
let isMenuOpen = false;

function todayString() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function monthString(dateString = todayString()) {
  return dateString.slice(0, 7);
}

function createEmptyResponse() {
  return {
    participation: 'unknown',
    companionCount: 0,
    providesCar: false,
    driverCount: 0,
    availableSeats: 0,
    note: '',
  };
}

function createEvent(date) {
  return {
    title: '週末練習試合',
    date,
    venue: '未定',
    isExpedition: false,
    responses: Object.fromEntries(state?.players?.map((player) => [player.id, createEmptyResponse()]) ?? defaultPlayers.map((player) => [player.id, createEmptyResponse()])),
  };
}

function createInitialState() {
  const selectedDate = '2026-05-02';
  return {
    selectedDate,
    visibleMonth: '2026-05',
    screen: 'dispatch',
    players: defaultPlayers,
    events: createSeedEvents(defaultPlayers),
  };
}

function createSeedEvents(players) {
  return Object.fromEntries(
    seedDates.map((date, dateIndex) => [
      date,
      {
        title: '試合・練習',
        date,
        venue: '未定',
        responses: Object.fromEntries(
          players.map((player) => [
            player.id,
            {
              ...createEmptyResponse(),
              participation: seedParticipation[player.id]?.[dateIndex] ?? 'unknown',
            },
          ]),
        ),
      },
    ]),
  );
}

function normalizeCount(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.floor(numberValue));
}

function normalizeResponse(response = {}) {
  return {
    participation: ['unknown', 'yes', 'no'].includes(response.participation) ? response.participation : 'unknown',
    companionCount: normalizeCount(response.companionCount),
    providesCar: Boolean(response.providesCar),
    driverCount: normalizeCount(response.driverCount ?? (response.providesCar ? 1 : 0)),
    availableSeats: normalizeCount(response.availableSeats),
    note: typeof response.note === 'string' ? response.note : '',
  };
}

function normalizePlayer(player, fallbackIndex) {
  return {
    id: String(player?.id || `p${String(fallbackIndex + 1).padStart(2, '0')}`),
    name: String(player?.name || `選手${fallbackIndex + 1}`),
    grade: typeof player?.grade === 'string' ? player.grade : '',
  };
}

function normalizeEvent(rawEvent, date, players) {
  const sourceResponses = rawEvent?.responses ?? rawEvent ?? {};
  return {
    title: typeof rawEvent?.title === 'string' ? rawEvent.title : '週末練習試合',
    date,
    venue: typeof rawEvent?.venue === 'string' ? rawEvent.venue : '未定',
    isExpedition: Boolean(rawEvent?.isExpedition),
    responses: Object.fromEntries(
      players.map((player) => [player.id, normalizeResponse(sourceResponses[player.id])]),
    ),
  };
}

function normalizeState(savedState) {
  const fallback = createInitialState();
  const players = Array.isArray(savedState?.players) && savedState.players.length > 0
    ? savedState.players.map(normalizePlayer)
    : fallback.players;
  const selectedDate = typeof savedState?.selectedDate === 'string'
    ? savedState.selectedDate
    : typeof savedState?.event?.date === 'string'
      ? savedState.event.date
      : fallback.selectedDate;

  const rawEvents = savedState?.events && typeof savedState.events === 'object'
    ? savedState.events
    : savedState?.responses
      ? { [selectedDate]: { ...(savedState.event ?? {}), responses: savedState.responses } }
      : {};

  const events = Object.fromEntries(
    Object.entries(rawEvents).map(([date, event]) => [date, normalizeEvent(event, date, players)]),
  );

  if (!events[selectedDate]) {
    events[selectedDate] = normalizeEvent({}, selectedDate, players);
  }

  return {
    selectedDate,
    visibleMonth: typeof savedState?.visibleMonth === 'string' ? savedState.visibleMonth : monthString(selectedDate),
    screen: savedState?.screen === 'players' ? 'players' : 'dispatch',
    players,
    events,
  };
}

function loadBoardState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const oldStored = localStorage.getItem('baseball-dispatch-board:v1');
    return stored ? normalizeState(JSON.parse(stored)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveBoardState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentEvent() {
  if (!state.events[state.selectedDate]) {
    state.events[state.selectedDate] = normalizeEvent({}, state.selectedDate, state.players);
  }
  return state.events[state.selectedDate];
}

function currentResponses() {
  const event = currentEvent();
  state.players.forEach((player) => {
    if (!event.responses[player.id]) event.responses[player.id] = createEmptyResponse();
  });
  return event.responses;
}

function summarize() {
  const responses = currentResponses();
  const rows = state.players.map((player) => responses[player.id] ?? createEmptyResponse());
  const participatingPlayers = rows.filter((row) => row.participation === 'yes').length;
  const absentPlayers = rows.filter((row) => row.participation === 'no').length;
  const undecidedPlayers = rows.filter((row) => row.participation === 'unknown').length;
  const rawCompanionTotal = rows
    .filter((row) => row.participation === 'yes')
    .reduce((total, row) => total + row.companionCount, 0);
  const carCount = rows.filter((row) => row.providesCar).length;
  const driverTotal = rows.reduce((total, row) => total + (row.providesCar ? row.driverCount : 0), 0);
  const companionTotal = Math.max(0, rawCompanionTotal - driverTotal);
  const requiredRiders = participatingPlayers + companionTotal;
  const availableSeats = rows.reduce((total, row) => total + (row.providesCar ? row.availableSeats : 0), 0);
  const balance = availableSeats - requiredRiders;
  const status = balance < 0 ? 'shortage' : balance === 0 ? 'exact' : 'surplus';

  return { participatingPlayers, absentPlayers, undecidedPlayers, rawCompanionTotal, driverTotal, companionTotal, requiredRiders, carCount, availableSeats, balance, status };
}

function setState(nextState, shouldRender = true) {
  state = nextState;
  saveBoardState();
  if (shouldRender) render();
}

function updateEvent(patch, shouldRender = true) {
  const event = currentEvent();
  setState({
    ...state,
    events: {
      ...state.events,
      [state.selectedDate]: { ...event, ...patch, date: state.selectedDate },
    },
  }, shouldRender);
}

function updateResponse(playerId, patch, shouldRender = true) {
  const event = currentEvent();
  setState({
    ...state,
    events: {
      ...state.events,
      [state.selectedDate]: {
        ...event,
        responses: {
          ...event.responses,
          [playerId]: { ...event.responses[playerId], ...patch },
        },
      },
    },
  }, shouldRender);
}

function selectDate(date) {
  const events = { ...state.events };
  if (!events[date]) events[date] = normalizeEvent({}, date, state.players);
  setState({ ...state, selectedDate: date, visibleMonth: monthString(date), events });
}

function addPlayer(name, grade = '') {
  const trimmed = name.trim();
  if (!trimmed) return;
  const player = { id: `custom-${crypto.randomUUID()}`, name: trimmed, grade: grade.trim() };
  const events = Object.fromEntries(
    Object.entries(state.events).map(([date, event]) => [
      date,
      { ...event, responses: { ...event.responses, [player.id]: createEmptyResponse() } },
    ]),
  );
  setState({ ...state, players: [...state.players, player], events });
}

function deletePlayer(playerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return;
  if (!window.confirm(`${player.name} を選手一覧から削除しますか？各日付の入力データも削除されます。`)) return;
  const events = Object.fromEntries(
    Object.entries(state.events).map(([date, event]) => {
      const responses = { ...event.responses };
      delete responses[playerId];
      return [date, { ...event, responses }];
    }),
  );
  setState({ ...state, players: state.players.filter((item) => item.id !== playerId), events });
}

function updatePlayer(playerId, patch, shouldRender = true) {
  setState({
    ...state,
    players: state.players.map((player) => player.id === playerId ? { ...player, ...patch } : player),
  }, shouldRender);
}

function resetPlayersToDefault() {
  if (!window.confirm('選手一覧を初期状態に戻しますか？現在の入力データも初期選手に合わせて再作成されます。')) return;
  const events = Object.fromEntries(
    Object.entries(state.events).map(([date, event]) => [date, normalizeEvent({ ...event, responses: {} }, date, defaultPlayers)]),
  );
  setState({ ...state, players: defaultPlayers, events });
}

function render() {
  const event = currentEvent();
  const summary = summarize();
  const root = document.querySelector('#root');

  root.innerHTML = `
    <main class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Baseball dispatch board</p>
          <h1>${state.screen === 'players' ? '選手マスタ管理' : '配車調整ボード'}</h1>
        </div>
        <button class="menu-toggle" type="button" data-action="toggle-menu" aria-label="メニューを開く" aria-expanded="${isMenuOpen}">
          <span></span><span></span><span></span>
        </button>
        <div class="header-actions ${isMenuOpen ? 'open' : ''}">
          <button class="ghost-button" type="button" data-action="show-dispatch">配車画面</button>
          <button class="ghost-button" type="button" data-action="show-players">選手管理</button>
          <button class="ghost-button" type="button" data-action="reset">全データ初期化</button>
        </div>
      </header>

      ${state.screen === 'players' ? playersScreenHtml() : dispatchScreenHtml(event, summary)}
    </main>
  `;

  bindEvents();
}

function dispatchScreenHtml(event, summary) {
  return `
      <section class="calendar-panel" aria-label="日付選択">
        <div class="calendar-toolbar">
          <button class="ghost-button" type="button" data-action="prev-month">前月</button>
          ${textField('visible-month', '表示月', state.visibleMonth, 'month')}
          <button class="ghost-button" type="button" data-action="next-month">翌月</button>
        </div>
        <div class="calendar-grid calendar-weekdays">${weekdayLabels.map((label) => `<span>${label}</span>`).join('')}</div>
        <div class="calendar-grid calendar-days">${calendarDaysHtml()}</div>
      </section>

      <section class="event-panel" aria-label="イベント情報">
        ${dateExpeditionField(event)}
        ${textField('event-title', 'イベント名', event.title)}
        ${textField('event-venue', '会場', event.venue)}
      </section>

      <section class="summary-panel ${summary.status} ${event.isExpedition ? 'expedition-summary' : ''}" aria-live="polite">
        <div class="summary-row top-row">
          ${summaryMetric('参加選手', 'participatingPlayers', summary.participatingPlayers)}
          ${summaryMetric('欠席選手', 'absentPlayers', summary.absentPlayers)}
          ${summaryMetric('未定', 'undecidedPlayers', summary.undecidedPlayers)}
        </div>
        <div class="summary-row bottom-row">
          ${summaryMetric('配車数', 'carCount', summary.carCount)}
          ${summaryMetric('運転手', 'driverTotal', summary.driverTotal)}
          ${summaryMetric('乗車予定人数', 'requiredRiders', summary.requiredRiders)}
          ${summaryMetric('乗車可人数', 'availableSeats', summary.availableSeats)}
          <div class="summary-status">
            <span>過不足</span>
            <strong data-summary="status-label">${statusLabels[summary.status]}</strong>
          </div>
        </div>
      </section>

      <section class="player-list" aria-label="選手別入力">
        <div class="desktop-header">
          <span>選手</span><span>参加</span><span>同伴者</span><span>車出し</span><span>運転手</span><span>空席</span><span>メモ</span>
        </div>
        ${state.players.map(playerRow).join('')}
      </section>
  `;
}

function playersScreenHtml() {
  return `
      <section class="roster-admin master-screen" aria-label="選手マスタ管理">
        <div class="section-heading">
          <div>
            <h2>選手マスタ</h2>
            <p>ここで登録した選手が、すべての日付の配車入力欄に表示されます。</p>
          </div>
          <button class="ghost-button" type="button" data-action="reset-players">初期選手に戻す</button>
        </div>
        <div class="roster-toolbar">
          ${textField('new-player', '選手名', '', 'text', '選手名')}
          ${textField('new-grade', '学年/属性', '', 'text', '例: 6年')}
          <button type="button" data-action="add-player">追加</button>
        </div>
        <div class="admin-player-list">
          ${state.players.map(adminPlayerRow).join('')}
        </div>
      </section>
  `;
}

function calendarDaysHtml() {
  const [year, month] = state.visibleMonth.split('-').map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDate.getDay();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push('<span class="calendar-day empty"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasData = Boolean(state.events[date]);
    const isSelected = date === state.selectedDate;
    const isExpedition = Boolean(state.events[date]?.isExpedition);
    cells.push(`
      <button class="calendar-day ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : ''} ${isExpedition ? 'expedition-day' : ''}" type="button" data-action="select-date" data-date="${date}">
        <span>${day}</span>
      </button>
    `);
  }

  return cells.join('');
}

function dateExpeditionField(event) {
  return `
    <div class="date-expedition-field">
      <label>
        <span>選択日</span>
        <input data-field="event-date" type="date" value="${escapeAttribute(state.selectedDate)}" />
      </label>
      <label class="expedition-check">
        <input type="checkbox" data-field="event-expedition" ${event.isExpedition ? 'checked' : ''} />
        <span>遠征</span>
      </label>
    </div>
  `;
}

function textField(field, label, value, type = 'text', placeholder = '') {
  return `
    <label>
      <span>${label}</span>
      <input data-field="${field}" type="${type}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" />
    </label>
  `;
}

function summaryMetric(label, key, value) {
  return `
    <div class="summary-metric ${key}-metric">
      <span>${label}</span>
      <strong data-summary="${key}">${value}</strong>
    </div>
  `;
}

function refreshSummary() {
  const summary = summarize();
  const panel = document.querySelector('.summary-panel');
  if (!panel) return;

  panel.classList.remove('shortage', 'exact', 'surplus');
  panel.classList.add(summary.status);
  setSummaryText('status-label', statusLabels[summary.status]);
  setSummaryText('participatingPlayers', summary.participatingPlayers);
  setSummaryText('absentPlayers', summary.absentPlayers);
  setSummaryText('undecidedPlayers', summary.undecidedPlayers);
  setSummaryText('carCount', summary.carCount);
  setSummaryText('driverTotal', summary.driverTotal);
  setSummaryText('requiredRiders', summary.requiredRiders);
  setSummaryText('availableSeats', summary.availableSeats);
}

function setSummaryText(key, value) {
  const element = document.querySelector(`[data-summary="${key}"]`);
  if (element) element.textContent = String(value);
}

function adminPlayerRow(player) {
  return `
    <article class="admin-player-row">
      <input value="${escapeAttribute(player.name)}" aria-label="選手名" data-field="admin-name" data-player-id="${player.id}" />
      <input value="${escapeAttribute(player.grade ?? '')}" aria-label="学年" placeholder="学年/属性" data-field="admin-grade" data-player-id="${player.id}" />
      <button class="danger-button" type="button" data-action="delete-player" data-player-id="${player.id}">削除</button>
    </article>
  `;
}

function playerRow(player) {
  const response = currentResponses()[player.id] ?? createEmptyResponse();
  const buttons = Object.entries(participationLabels)
    .map(([status, label]) => `
      <button class="${response.participation === status ? 'selected' : ''}" type="button" data-action="participation" data-player-id="${player.id}" data-status="${status}">
        ${label}
      </button>
    `)
    .join('');

  return `
    <article class="player-row">
      <div class="player-name">
        <strong>${escapeHtml(player.name)}</strong>
        ${player.grade ? `<span>${escapeHtml(player.grade)}</span>` : ''}
      </div>
      <div class="segmented-control" aria-label="${escapeAttribute(player.name)}の参加状況">${buttons}</div>
      <label class="number-field">
        <span>同伴者</span>
        <input type="number" min="0" inputmode="numeric" value="${response.companionCount}" data-field="companion" data-player-id="${player.id}" />
      </label>
      <label class="toggle-field">
        <input type="checkbox" ${response.providesCar ? 'checked' : ''} data-field="provides-car" data-player-id="${player.id}" />
        <span>車あり</span>
      </label>
      <label class="number-field">
        <span>運転手</span>
        <input type="number" min="0" inputmode="numeric" value="${response.driverCount}" ${response.providesCar ? '' : 'disabled'} data-field="driver" data-player-id="${player.id}" />
      </label>
      <label class="number-field">
        <span>空席</span>
        <input type="number" min="0" inputmode="numeric" value="${response.availableSeats}" ${response.providesCar ? '' : 'disabled'} data-field="seats" data-player-id="${player.id}" />
      </label>
      <label class="note-field">
        <span>メモ</span>
        <input value="${escapeAttribute(response.note)}" placeholder="集合場所など" data-field="note" data-player-id="${player.id}" />
      </label>
    </article>
  `;
}

function bindEvents() {
  document.querySelector('[data-action="toggle-menu"]').addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    render();
  });
  document.querySelector('[data-action="show-dispatch"]').addEventListener('click', () => {
    isMenuOpen = false;
    setState({ ...state, screen: 'dispatch' });
  });
  document.querySelector('[data-action="show-players"]').addEventListener('click', () => {
    isMenuOpen = false;
    setState({ ...state, screen: 'players' });
  });

  if (state.screen === 'players') {
    bindPlayerMasterEvents();
    bindGlobalEvents();
    return;
  }

  document.querySelector('[data-field="visible-month"]').addEventListener('input', (event) => {
    setState({ ...state, visibleMonth: event.target.value });
  });
  document.querySelector('[data-action="prev-month"]').addEventListener('click', () => shiftMonth(-1));
  document.querySelector('[data-action="next-month"]').addEventListener('click', () => shiftMonth(1));
  document.querySelectorAll('[data-action="select-date"]').forEach((button) => {
    button.addEventListener('click', () => selectDate(button.dataset.date));
  });

  document.querySelector('[data-field="event-title"]').addEventListener('input', (event) => updateEvent({ title: event.target.value }, false));
  document.querySelector('[data-field="event-date"]').addEventListener('input', (event) => selectDate(event.target.value));
  document.querySelector('[data-field="event-expedition"]').addEventListener('change', (event) => updateEvent({ isExpedition: event.target.checked }));
  document.querySelector('[data-field="event-venue"]').addEventListener('input', (event) => updateEvent({ venue: event.target.value }, false));

  document.querySelectorAll('[data-action="participation"]').forEach((button) => {
    button.addEventListener('click', () => updateResponse(button.dataset.playerId, { participation: button.dataset.status }));
  });

  document.querySelectorAll('[data-field="companion"]').forEach((input) => {
    input.addEventListener('input', () => {
      updateResponse(input.dataset.playerId, { companionCount: normalizeCount(input.value) }, false);
      refreshSummary();
    });
  });

  document.querySelectorAll('[data-field="provides-car"]').forEach((input) => {
    input.addEventListener('change', () => {
      const response = currentResponses()[input.dataset.playerId];
      updateResponse(input.dataset.playerId, {
        providesCar: input.checked,
        driverCount: input.checked ? 1 : 0,
        availableSeats: input.checked ? response.availableSeats : 0,
      });
    });
  });

  document.querySelectorAll('[data-field="driver"]').forEach((input) => {
    input.addEventListener('input', () => {
      updateResponse(input.dataset.playerId, { driverCount: normalizeCount(input.value) }, false);
      refreshSummary();
    });
  });

  document.querySelectorAll('[data-field="seats"]').forEach((input) => {
    input.addEventListener('input', () => {
      updateResponse(input.dataset.playerId, { availableSeats: normalizeCount(input.value) }, false);
      refreshSummary();
    });
  });

  document.querySelectorAll('[data-field="note"]').forEach((input) => {
    input.addEventListener('input', () => updateResponse(input.dataset.playerId, { note: input.value }, false));
  });

  bindGlobalEvents();
}

function bindPlayerMasterEvents() {
  document.querySelectorAll('[data-field="admin-name"]').forEach((input) => {
    input.addEventListener('input', () => updatePlayer(input.dataset.playerId, { name: input.value }, false));
  });
  document.querySelectorAll('[data-field="admin-grade"]').forEach((input) => {
    input.addEventListener('input', () => updatePlayer(input.dataset.playerId, { grade: input.value }, false));
  });
  document.querySelectorAll('[data-action="delete-player"]').forEach((button) => {
    button.addEventListener('click', () => deletePlayer(button.dataset.playerId));
  });

  document.querySelector('[data-action="reset-players"]').addEventListener('click', resetPlayersToDefault);
  document.querySelector('[data-action="add-player"]').addEventListener('click', () => {
    const nameInput = document.querySelector('[data-field="new-player"]');
    const gradeInput = document.querySelector('[data-field="new-grade"]');
    addPlayer(nameInput.value, gradeInput.value);
  });
}

function bindGlobalEvents() {
  document.querySelector('[data-action="reset"]').addEventListener('click', () => {
    isMenuOpen = false;
    if (!window.confirm('全日付の配車データと選手管理を初期化しますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('baseball-dispatch-board:v1');
    localStorage.removeItem('baseball-dispatch-board:v2');
    setState(createInitialState());
  });
}

function shiftMonth(amount) {
  const [year, month] = state.visibleMonth.split('-').map(Number);
  const next = new Date(year, month - 1 + amount, 1);
  const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  setState({ ...state, visibleMonth: nextMonth });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

render();
