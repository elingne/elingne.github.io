// Calendar update: holidays and today scroll
// Holiday data: hyunbinseo/holidays-kr (MIT), snapshot 2026-10-22, years 2018-2027.
const KOREAN_HOLIDAYS = {"2018-01-01":["1월 1일"],"2018-02-15":["설날 전날"],"2018-02-16":["설날"],"2018-02-17":["설날 다음 날"],"2018-03-01":["3ㆍ1절"],"2018-05-05":["어린이날"],"2018-05-07":["대체공휴일(어린이날)"],"2018-05-22":["부처님 오신 날"],"2018-06-06":["현충일"],"2018-06-13":["전국동시지방선거"],"2018-08-15":["광복절"],"2018-09-23":["추석 전날"],"2018-09-24":["추석"],"2018-09-25":["추석 다음 날"],"2018-09-26":["대체공휴일(추석)"],"2018-10-03":["개천절"],"2018-10-09":["한글날"],"2018-12-25":["기독탄신일"],"2019-01-01":["1월 1일"],"2019-02-04":["설날 전날"],"2019-02-05":["설날"],"2019-02-06":["설날 다음 날"],"2019-03-01":["3ㆍ1절"],"2019-05-05":["어린이날"],"2019-05-06":["대체공휴일(어린이날)"],"2019-05-12":["부처님 오신 날"],"2019-06-06":["현충일"],"2019-08-15":["광복절"],"2019-09-12":["추석 전날"],"2019-09-13":["추석"],"2019-09-14":["추석 다음 날"],"2019-10-03":["개천절"],"2019-10-09":["한글날"],"2019-12-25":["기독탄신일"],"2020-01-01":["1월 1일"],"2020-01-24":["설날 전날"],"2020-01-25":["설날"],"2020-01-26":["설날 다음 날"],"2020-01-27":["대체공휴일(설날)"],"2020-03-01":["3ㆍ1절"],"2020-04-15":["제21대 국회의원선거"],"2020-04-30":["부처님 오신 날"],"2020-05-05":["어린이날"],"2020-06-06":["현충일"],"2020-08-15":["광복절"],"2020-08-17":["임시공휴일"],"2020-09-30":["추석 전날"],"2020-10-01":["추석"],"2020-10-02":["추석 다음 날"],"2020-10-03":["개천절"],"2020-10-09":["한글날"],"2020-12-25":["기독탄신일"],"2021-01-01":["1월 1일"],"2021-02-11":["설날 전날"],"2021-02-12":["설날"],"2021-02-13":["설날 다음 날"],"2021-03-01":["3ㆍ1절"],"2021-05-05":["어린이날"],"2021-05-19":["부처님 오신 날"],"2021-06-06":["현충일"],"2021-08-15":["광복절"],"2021-08-16":["대체공휴일(광복절)"],"2021-09-20":["추석 전날"],"2021-09-21":["추석"],"2021-09-22":["추석 다음 날"],"2021-10-03":["개천절"],"2021-10-04":["대체공휴일(개천절)"],"2021-10-09":["한글날"],"2021-10-11":["대체공휴일(한글날)"],"2021-12-25":["기독탄신일"],"2022-01-01":["1월 1일"],"2022-01-31":["설날 전날"],"2022-02-01":["설날"],"2022-02-02":["설날 다음 날"],"2022-03-01":["3ㆍ1절"],"2022-03-09":["대통령선거"],"2022-05-05":["어린이날"],"2022-05-08":["부처님 오신 날"],"2022-06-01":["전국동시지방선거"],"2022-06-06":["현충일"],"2022-08-15":["광복절"],"2022-09-09":["추석 전날"],"2022-09-10":["추석"],"2022-09-11":["추석 다음 날"],"2022-09-12":["대체공휴일(추석)"],"2022-10-03":["개천절"],"2022-10-09":["한글날"],"2022-10-10":["대체공휴일(한글날)"],"2022-12-25":["기독탄신일"],"2023-01-01":["1월 1일"],"2023-01-21":["설날 전날"],"2023-01-22":["설날"],"2023-01-23":["설날 다음 날"],"2023-01-24":["대체공휴일(설날)"],"2023-03-01":["3ㆍ1절"],"2023-05-05":["어린이날"],"2023-05-27":["부처님 오신 날"],"2023-05-29":["대체공휴일(부처님 오신 날)"],"2023-06-06":["현충일"],"2023-08-15":["광복절"],"2023-09-28":["추석 전날"],"2023-09-29":["추석"],"2023-09-30":["추석 다음 날"],"2023-10-02":["임시공휴일"],"2023-10-03":["개천절"],"2023-10-09":["한글날"],"2023-12-25":["기독탄신일"],"2024-01-01":["1월 1일"],"2024-02-09":["설날 전날"],"2024-02-10":["설날"],"2024-02-11":["설날 다음 날"],"2024-02-12":["대체공휴일(설날)"],"2024-03-01":["3ㆍ1절"],"2024-04-10":["제22대국회의원선거"],"2024-05-05":["어린이날"],"2024-05-06":["대체공휴일(어린이날)"],"2024-05-15":["부처님 오신 날"],"2024-06-06":["현충일"],"2024-08-15":["광복절"],"2024-09-16":["추석 전날"],"2024-09-17":["추석"],"2024-09-18":["추석 다음 날"],"2024-10-01":["임시공휴일"],"2024-10-03":["개천절"],"2024-10-09":["한글날"],"2024-12-25":["기독탄신일"],"2025-01-01":["1월 1일"],"2025-01-27":["임시공휴일"],"2025-01-28":["설날 전날"],"2025-01-29":["설날"],"2025-01-30":["설날 다음 날"],"2025-03-01":["3ㆍ1절"],"2025-03-03":["대체공휴일(3ㆍ1절)"],"2025-05-05":["어린이날","부처님 오신 날"],"2025-05-06":["대체공휴일(부처님 오신 날)"],"2025-06-03":["임시공휴일(대통령선거)"],"2025-06-06":["현충일"],"2025-08-15":["광복절"],"2025-10-03":["개천절"],"2025-10-05":["추석 전날"],"2025-10-06":["추석"],"2025-10-07":["추석 다음 날"],"2025-10-08":["대체공휴일(추석)"],"2025-10-09":["한글날"],"2025-12-25":["기독탄신일"],"2026-01-01":["1월 1일"],"2026-02-16":["설날 전날"],"2026-02-17":["설날"],"2026-02-18":["설날 다음 날"],"2026-03-01":["3ㆍ1절"],"2026-03-02":["대체공휴일(3ㆍ1절)"],"2026-05-01":["노동절"],"2026-05-05":["어린이날"],"2026-05-24":["부처님 오신 날"],"2026-05-25":["대체공휴일(부처님 오신 날)"],"2026-06-03":["전국동시지방선거"],"2026-06-06":["현충일"],"2026-07-17":["제헌절"],"2026-08-15":["광복절"],"2026-08-17":["대체공휴일(광복절)"],"2026-09-24":["추석 전날"],"2026-09-25":["추석"],"2026-09-26":["추석 다음 날"],"2026-10-03":["개천절"],"2026-10-05":["대체공휴일(개천절)"],"2026-10-09":["한글날"],"2026-12-25":["기독탄신일"],"2027-01-01":["1월 1일"],"2027-02-06":["설날 전날"],"2027-02-07":["설날"],"2027-02-08":["설날 다음 날"],"2027-02-09":["대체공휴일(설날)"],"2027-03-01":["3ㆍ1절"],"2027-05-01":["노동절"],"2027-05-03":["대체공휴일(노동절)"],"2027-05-05":["어린이날"],"2027-05-13":["부처님 오신 날"],"2027-06-06":["현충일"],"2027-07-17":["제헌절"],"2027-07-19":["대체공휴일(제헌절)"],"2027-08-15":["광복절"],"2027-08-16":["대체공휴일(광복절)"],"2027-09-14":["추석 전날"],"2027-09-15":["추석"],"2027-09-16":["추석 다음 날"],"2027-10-03":["개천절"],"2027-10-04":["대체공휴일(개천절)"],"2027-10-09":["한글날"],"2027-10-11":["대체공휴일(한글날)"],"2027-12-25":["기독탄신일"],"2027-12-27":["대체공휴일(기독탄신일)"]};
let currentDate = new Date();
let selectedRecordDate = null;
let currentPeriodRecordId = null;
let clickTimer = null;
let dragStartDate = null;
let dragCurrentDate = null;
let didRangeDrag = false;
let isOwner = false;
let suppressCalendarClickUntil = 0;
let scheduleTouchDragging = false;
let editingEventOriginalStartDate = null;
let editingEventSortOrder = null;
let calendarDraggedEventId = null;
let calendarDraggedSourceDate = null;
const LAST_PAGE_STORAGE_KEY = "eling-calendar:last-page";

const MOODS = [
  { value: "happy", label: "기쁨", className: "mood-happy" },
  { value: "neutral", label: "보통", className: "mood-neutral" },
  { value: "bad", label: "나쁨", className: "mood-bad" }
];

const $ = (id) => document.getElementById(id);

const siteApp = $("siteApp");
const logoutButton = $("logoutButton");

const navButtons = [...document.querySelectorAll(".nav-button")];
const logoHomeButton = $("logoHomeButton");
const calendarPage = $("calendarPage");
const schedulePage = $("schedulePage");

const calendarTitle = $("calendarTitle");
const calendarGrid = $("calendarGrid");
const prevMonthButton = $("prevMonth");
const nextMonthButton = $("nextMonth");

const dayPanel = $("dayPanel");
const closeDayPanelButton = $("closeDayPanel");
const selectedDateTitle = $("selectedDateTitle");

const quickTodoInput = $("quickTodoInput");
const quickTodoAddButton = $("quickTodoAddButton");
const quickTodoList = $("quickTodoList");
const quickTodoHistory = $("quickTodoHistory");
const quickTodoCompletedList = $("quickTodoCompletedList");

const dayTodoForm = $("dayTodoForm");
const dayTodoInput = $("dayTodoInput");
const dayTodoList = $("dayTodoList");
const todoAccordionToggle = $('todoAccordionToggle');
const todoAccordionBody = $('todoAccordionBody');
const todoAccordionLabel = $('todoAccordionLabel');

const moodPicker = $("moodPicker");
const moodPickerButton = $("moodPickerButton");
const moodPickerDot = $("moodPickerDot");
const moodPickerLabel = $("moodPickerLabel");
const moodPickerMenu = $("moodPickerMenu");
const periodCheck = $("periodCheck");
const quickMetaSaveState = $("quickMetaSaveState");

const openScheduleCreateButton = $("openScheduleCreateButton");
const scheduleList = $("scheduleList");

const eventModal = $("eventModal");
const eventModalTitle = $("eventModalTitle");
const eventModalCloseButton = $("eventModalCloseButton");
const eventModalForm = $("eventModalForm");
const eventIdInput = $("eventIdInput");
const eventTitleInput = $("eventTitleInput");
const eventStartInput = $("eventStartInput");
const eventEndInput = $("eventEndInput");
const eventDescriptionInput = $("eventDescriptionInput");
const eventColorInputs = [...document.querySelectorAll('input[name="eventColor"]')];
const eventDeleteButton = $("eventDeleteButton");
const eventCancelButton = $("eventCancelButton");
const eventModalMessage = $("eventModalMessage");

const searchButton = $("searchButton");
const searchModal = $("searchModal");
const searchCloseButton = $("searchCloseButton");
const searchInput = $("searchInput");
const searchResults = $("searchResults");

/* AUTH */
function savedPage() { try {return localStorage.getItem(LAST_PAGE_STORAGE_KEY)||'calendar';}catch{return 'calendar';} }
async function checkSession() {
  try {
    const response = await fetch('/api/session', {cache:'no-store'});
    if (!response.ok) throw Error('연결 실패');
    isOwner = Boolean((await response.json()).owner);
    document.body.classList.toggle('read-only', !isOwner);
    document.querySelectorAll('[data-page="schedule"], #searchButton, .quick-todo-card').forEach(el => el.classList.toggle('hidden', !isOwner));
    logoutButton.textContent = isOwner ? '로그아웃' : '관리자 로그인';
    await showPage(isOwner ? savedPage() : 'calendar');
  } catch (error) { console.error('Calendar initialization failed', error); document.getElementById('connectionMessage').textContent = '서버에 연결하지 못했어요. 잠시 후 새로고침해주세요.'; }
}
logoutButton.addEventListener('click', () => { location.href = isOwner ? '/cdn-cgi/access/logout' : '/admin'; });
/* NAV */
logoHomeButton.addEventListener("click", () => {
  showPage("calendar");
  window.setTimeout(() => {
    renderCalendar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 0);
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

async function showPage(page) {
  const allowedPages = isOwner
    ? ["calendar", "schedule"]
    : ["calendar"];

  if (!allowedPages.includes(page)) page = "calendar";

  try {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, page);
  } catch (error) {
    console.warn("탭 상태 저장 실패:", error);
  }

  calendarPage.classList.toggle("hidden", page !== "calendar");
  schedulePage.classList.toggle("hidden", page !== "schedule");


  navButtons.forEach((button) =>
    button.classList.toggle("active", button.dataset.page === page)
  );

  dayPanel.classList.remove("open");

  if (page === "calendar") {
    renderCalendar();
    if (isOwner) loadQuickTodos();
  }

  if (page === "schedule") {
    loadSchedulePage({ scrollToToday: true });
  }

}

/* UTILS */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(key) {
  return new Date(`${key}T00:00:00`);
}

function niceDate(key) {
  const d = parseLocalDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function normalizeMoodValue(value) {
  if (value === "great" || value === "good") return "happy";
  if (value === "low") return "bad";
  return value || "";
}

function moodMeta(value) {
  const normalized = normalizeMoodValue(value);
  return MOODS.find(item => item.value === normalized) || null;
}

function setMoodPickerValue(value) {
  const meta = moodMeta(value);
  const normalized = meta?.value || "";

  moodPicker.dataset.value = normalized;
  moodPickerLabel.textContent = meta?.label || "기분";
  moodPickerDot.className = `mood-dot ${meta?.className || "mood-none"}`;

  moodPickerMenu.querySelectorAll("[data-mood]").forEach(button => {
    button.classList.toggle("active", button.dataset.mood === normalized);
  });
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/* TOUCH / DRAG HELPERS */
function createDragGhost(source, x, y) {
  const ghost = source.cloneNode(true);
  ghost.classList.add("touch-drag-ghost");
  ghost.style.width = `${Math.min(source.getBoundingClientRect().width, 320)}px`;
  document.body.appendChild(ghost);

  const move = (px, py) => {
    ghost.style.left = `${px + 12}px`;
    ghost.style.top = `${py + 12}px`;
  };

  move(x, y);
  return { ghost, move };
}

function clearTouchDropTargets() {
  document.querySelectorAll(".touch-drop-target").forEach(el => el.classList.remove("touch-drop-target"));
}

function enableLongPressReorder(row, container, onCommit, options = {}) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let ghostApi = null;
  let lastX = 0;
  let lastY = 0;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const reset = () => {
    clearTimer();
    active = false;
    scheduleTouchDragging = false;
    row.classList.remove("touch-dragging");
    ghostApi?.ghost.remove();
    ghostApi = null;
    clearTouchDropTargets();
  };

  row.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;
    if (options.excludeSelector && event.target.closest(options.excludeSelector)) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      scheduleTouchDragging = true;
      suppressCalendarClickUntil = Date.now() + 1000;
      row.classList.add("touch-dragging");
      ghostApi = createDragGhost(row, lastX, lastY);
      navigator.vibrate?.(25);
      options.onStart?.();
    }, options.delay || 430);
  }, { passive: true });

  row.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      // 길게 누르기 전에 확실히 스크롤을 시작한 경우에만 롱프레스를 취소
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();
    ghostApi?.move(lastX, lastY);

    const target = document
      .elementFromPoint(lastX, lastY)
      ?.closest(options.targetSelector || ".quick-item");

    if (!target || target === row || !container.contains(target)) return;
    if (options.acceptTarget && !options.acceptTarget(target)) return;

    const rect = target.getBoundingClientRect();
    const after = lastY > rect.top + rect.height / 2;
    container.insertBefore(row, after ? target.nextSibling : target);
  }, { passive: false });

  const finish = async event => {
    clearTimer();

    if (!active) return;

    if (event.cancelable) event.preventDefault();

    try {
      await onCommit?.();
    } finally {
      options.onEnd?.();
      reset();
    }
  };

  row.addEventListener("touchend", finish, { passive: false });
  row.addEventListener("touchcancel", finish, { passive: false });
}

function completedPayload(table, id, title) {
  return JSON.stringify({ table, id: Number(id), title });
}

async function moveCompletedItemToDate(table, id, targetDate) {
  if (!isOwner || !targetDate) return;

  const completedAt = new Date(`${targetDate}T12:00:00`).toISOString();
  let result;

  if (table === "quick_todos") {
    result = await dbClient
      .from("quick_todos")
      .update({
        is_completed: true,
        completed_at: completedAt
      })
      .eq("id", id);
  } else {
    result = await dbClient
      .from("todos")
      .update({
        target_date: targetDate,
        is_completed: true,
        completed_at: completedAt
      })
      .eq("id", id);
  }

  if (result.error) {
    console.error("완료한 일 날짜 이동 오류:", result.error);
    return;
  }

  await loadQuickTodos();

  if (selectedRecordDate && dayPanel.classList.contains("open")) {
    await loadDayTodos(selectedRecordDate);
  }

  renderCalendar();
}

function enableCompletedTouchMove(row, item) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let ghostApi = null;
  let highlighted = null;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const clearState = () => {
    clearTimer();
    active = false;
    row.classList.remove("touch-dragging");
    ghostApi?.ghost.remove();
    ghostApi = null;
    highlighted?.classList.remove("touch-drop-target");
    highlighted = null;
  };

  row.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;
    if (event.target.closest("button, input, .quick-item-editable")) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      suppressCalendarClickUntil = Date.now() + 1000;
      row.classList.add("touch-dragging");
      ghostApi = createDragGhost(row, lastX, lastY);
      navigator.vibrate?.(25);

      // 사이드탭의 완료 기록은 달력으로 옮겨야 하므로 드래그 시작 시 패널을 닫는다.
      if (dayPanel.classList.contains("open")) closeDayPanel();
    }, 430);
  }, { passive: true });

  row.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();
    ghostApi?.move(lastX, lastY);

    const cell = document.elementFromPoint(lastX, lastY)?.closest(".calendar-day");

    if (cell !== highlighted) {
      highlighted?.classList.remove("touch-drop-target");
      highlighted = cell || null;
      highlighted?.classList.add("touch-drop-target");
    }
  }, { passive: false });

  const finish = async event => {
    clearTimer();
    if (!active) return;

    if (event.cancelable) event.preventDefault();

    const targetDate = highlighted?.dataset.date || null;
    clearState();

    if (targetDate) {
      await moveCompletedItemToDate(item.table, item.id, targetDate);
    }
  };

  row.addEventListener("touchend", finish, { passive: false });
  row.addEventListener("touchcancel", finish, { passive: false });
}

function enableCalendarTouchRange(cell) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  cell.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;
    if (event.target.closest(".calendar-event-chip")) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      suppressCalendarClickUntil = Date.now() + 1000;
      dragStartDate = cell.dataset.date;
      dragCurrentDate = cell.dataset.date;
      paintDragRange(dragStartDate, dragCurrentDate);
      navigator.vibrate?.(25);
    }, 430);
  }, { passive: true });

  cell.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();

    const target = document.elementFromPoint(lastX, lastY)?.closest(".calendar-day");
    if (!target) return;

    dragCurrentDate = target.dataset.date;
    paintDragRange(dragStartDate, dragCurrentDate);
  }, { passive: false });

  const finish = event => {
    clearTimer();
    if (!active) return;

    if (event.cancelable) event.preventDefault();

    const start = dragStartDate;
    const end = dragCurrentDate || start;

    clearDragRange();
    dragStartDate = null;
    dragCurrentDate = null;
    active = false;

    if (!start || !end || start === end) return;

    const ordered = [start, end].sort();
    openEventModal({ start_date: ordered[0], end_date: ordered[1] });
  };

  cell.addEventListener("touchend", finish, { passive: false });
  cell.addEventListener("touchcancel", finish, { passive: false });
}

/* CALENDAR */
function renderCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  calendarTitle.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const previousMonthLastDate = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    createDayCell(new Date(year, month - 1, previousMonthLastDate - i), true);
  }

  for (let d = 1; d <= lastDate; d++) {
    createDayCell(new Date(year, month, d), false);
  }

  const totalCells = calendarGrid.children.length;
  const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;

  for (let d = 1; d <= remaining; d++) {
    createDayCell(new Date(year, month + 1, d), true);
  }

  loadCalendarExtras(year, month);
}

function createDayCell(date, otherMonth) {
  const cell = document.createElement("div");
  cell.className = "calendar-day";
  cell.dataset.date = formatDateKey(date);

  if (otherMonth) cell.classList.add("other-month");
  if (date.getDay() === 0) cell.classList.add("sunday");
  if (date.getDay() === 6) cell.classList.add("saturday");

  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    cell.classList.add("today");
  }

  const number = document.createElement("div");
  number.className = "day-number";
  number.textContent = date.getDate();
  cell.appendChild(number);

  const holidayNames = KOREAN_HOLIDAYS[cell.dataset.date] || [];
  cell.classList.toggle("public-holiday", holidayNames.length > 0);
  const holidayLabel = document.createElement("div");
  holidayLabel.className = "calendar-holiday-name";
  holidayLabel.textContent = holidayNames.join(" · ");
  holidayLabel.title = holidayLabel.textContent;
  cell.appendChild(holidayLabel);

  const eventsBox = document.createElement("div");
  eventsBox.className = "calendar-event-list";
  cell.appendChild(eventsBox);

  cell.addEventListener("click", () => {
    if (Date.now() < suppressCalendarClickUntil || scheduleTouchDragging) return;

    if (didRangeDrag) {
      didRangeDrag = false;
      return;
    }

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => openDayPanel(date), 220);
  });

  cell.addEventListener("dblclick", (event) => {
    event.preventDefault();
    clearTimeout(clickTimer);

    if (!isOwner) return;

    const key = formatDateKey(date);
    openEventModal({
      start_date: key,
      end_date: key
    });
  });

  cell.addEventListener("mousedown", (event) => {
    if (!isOwner || event.button !== 0) return;
    if (event.target.closest(".calendar-event-chip")) return;

    dragStartDate = cell.dataset.date;
    dragCurrentDate = cell.dataset.date;
    didRangeDrag = false;
  });

  cell.addEventListener("mouseenter", () => {
    if (!dragStartDate) return;
    dragCurrentDate = cell.dataset.date;

    if (dragCurrentDate !== dragStartDate) {
      didRangeDrag = true;
      paintDragRange(dragStartDate, dragCurrentDate);
    }
  });

  cell.addEventListener("dragover", event => {
    if (!isOwner) return;

    const raw = [...(event.dataTransfer?.types || [])];
    if (
      raw.includes("application/x-completed-item") ||
      raw.includes("application/x-calendar-event")
    ) {
      event.preventDefault();
      cell.classList.add("touch-drop-target");
    }
  });

  cell.addEventListener("dragleave", () => {
    cell.classList.remove("touch-drop-target");
  });

  cell.addEventListener("drop", async event => {
    cell.classList.remove("touch-drop-target");

    const completedPayloadText = event.dataTransfer?.getData("application/x-completed-item");
    const eventId = event.dataTransfer?.getData("application/x-calendar-event");

    if (eventId) {
      event.preventDefault();

      const sourceDate = event.dataTransfer?.getData("application/x-calendar-reorder-date");
      const targetDate = cell.dataset.date;
      const shouldCopy =
        event.altKey ||
        event.dataTransfer?.getData("application/x-calendar-copy") === "1";

      if (sourceDate === targetDate) {
        const box = cell.querySelector(".calendar-event-list");
        const ids = [...box.querySelectorAll(".calendar-event-chip[data-event-id]")]
          .map(el => Number(el.dataset.eventId));

        if (ids.length) await saveCalendarEventOrderForDate(targetDate, ids);
      } else if (shouldCopy) {
        await copyEventToDate(eventId, targetDate);
      } else {
        await moveEventToDate(eventId, targetDate);
      }

      return;
    }

    if (!completedPayloadText) return;

    event.preventDefault();

    try {
      const payload = JSON.parse(completedPayloadText);
      await moveCompletedItemToDate(payload.table, payload.id, cell.dataset.date);
    } catch (error) {
      console.error("완료한 일 드롭 오류:", error);
    }
  });

  enableCalendarTouchRange(cell);
  calendarGrid.appendChild(cell);
}

document.addEventListener("mouseup", () => {
  if (!dragStartDate) return;

  const start = dragStartDate;
  const end = dragCurrentDate || dragStartDate;
  clearDragRange();

  dragStartDate = null;
  dragCurrentDate = null;

  if (!didRangeDrag || start === end || !isOwner) return;

  const ordered = [start, end].sort();
  openEventModal({
    start_date: ordered[0],
    end_date: ordered[1]
  });
});

function paintDragRange(a, b) {
  const [start, end] = [a, b].sort();
  document.querySelectorAll(".calendar-day").forEach((cell) => {
    cell.classList.toggle(
      "drag-range",
      cell.dataset.date >= start && cell.dataset.date <= end
    );
  });
}

function clearDragRange() {
  document.querySelectorAll(".calendar-day.drag-range").forEach((cell) =>
    cell.classList.remove("drag-range")
  );
}

prevMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});

/* CALENDAR EXTRAS */
async function loadCalendarExtras() {
  const visibleCells = [...document.querySelectorAll(".calendar-day")];
  if (!visibleCells.length) return;

  const start = visibleCells[0].dataset.date;
  const end = visibleCells[visibleCells.length - 1].dataset.date;

  const [moodsResult, eventsResult, periodsResult] = await Promise.all([
    isOwner ? dbClient.from("moods").select("*").gte("record_date", start).lte("record_date", end) : {data:[]},
    dbClient.from("events").select("*").lte("start_date", end).gte("end_date", start),
    isOwner ? dbClient.from("period_records").select("*").lte("start_date", end).gte("end_date", start) : {data:[]}
  ]);

  const moods = moodsResult.data || [];
  const events = eventsResult.data || [];
  const periods = periodsResult.data || [];

  if (visibleCells[0] !== calendarGrid.firstElementChild) return;
  visibleCells.forEach((cell) => {
    const key = cell.dataset.date;

    const badgeWrap = document.createElement("div");
    badgeWrap.className = "calendar-top-badges";

    const mood = moods.find(item => item.record_date === key);
    if (mood) {
      const meta = moodMeta(mood.mood_type);
      if (meta) {
        const badge = document.createElement("span");
        badge.className = `calendar-simple-badge mood-badge ${meta.className}`;
        badge.title = meta.label;

        const dot = document.createElement("i");
        dot.className = `mood-dot ${meta.className}`;
        badge.appendChild(dot);

        badgeWrap.appendChild(badge);
      }
    }

    const periodOn = periods.some(item =>
      item.start_date <= key && item.end_date >= key
    );

    if (periodOn) {
      const badge = document.createElement("span");
      badge.className = "calendar-simple-badge period-drop";
      badge.title = "생리";
      const drop = document.createElement("i");
      drop.className = "red-drop-icon";
      badge.appendChild(drop);
      badgeWrap.appendChild(badge);
    }

    if (badgeWrap.children.length) {
      cell.appendChild(badgeWrap);
    }

    const eventBox = cell.querySelector(".calendar-event-list");

    if (isOwner) {
      eventBox.addEventListener("dragover", dragEvent => {
        if (!calendarDraggedEventId || calendarDraggedSourceDate !== key) return;

        dragEvent.preventDefault();
        dragEvent.stopPropagation();

        const dragging = eventBox.querySelector(
          `.calendar-event-chip[data-event-id="${calendarDraggedEventId}"]`
        );

        if (!dragging) return;

        const candidates = [...eventBox.querySelectorAll(".calendar-event-chip")]
          .filter(item => item !== dragging);

        const next = candidates.find(item => {
          const rect = item.getBoundingClientRect();
          return dragEvent.clientY < rect.top + rect.height / 2;
        });

        eventBox.insertBefore(dragging, next || null);
        cell.classList.add("calendar-ordering");
      });

      eventBox.addEventListener("drop", async dragEvent => {
        if (!calendarDraggedEventId || calendarDraggedSourceDate !== key) return;

        dragEvent.preventDefault();
        dragEvent.stopPropagation();
        cell.classList.remove("calendar-ordering");

        const ids = [...eventBox.querySelectorAll(".calendar-event-chip[data-event-id]")]
          .map(item => Number(item.dataset.eventId));

        if (ids.length) {
          await saveCalendarEventOrderForDate(key, ids);
        }
      });
    }

    // V32: 캘린더에서 바꾼 순서가 실제 표시 순서의 최우선 기준이 된다.
    // 시작일이 서로 다른 다일 일정끼리도 현재 날짜 칸에서 자유롭게 순서를 바꿀 수 있다.
    const cellEvents = [...events]
      .filter(event => event.start_date <= key && event.end_date >= key)
      .sort((a, b) =>
        (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
        a.start_date.localeCompare(b.start_date) ||
        b.end_date.localeCompare(a.end_date) ||
        a.id - b.id
      )
      .slice(0, 3);

    cellEvents.forEach((event, rowIndex) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `calendar-event-chip event-color-${event.color_variant === "pink" ? "pink" : "blue"}`;
      chip.dataset.eventId = event.id;
      chip.style.setProperty("--event-row", rowIndex);

      const continuesLeft = event.start_date < key;
      const continuesRight = event.end_date > key;

      if (continuesLeft) chip.classList.add("event-continues-left");
      if (continuesRight) chip.classList.add("event-continues-right");

      chip.textContent = continuesLeft ? "" : event.title;
      chip.title = event.title;

      chip.addEventListener("click", clickEvent => {
        if (Date.now() < suppressCalendarClickUntil) {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          return;
        }

        clickEvent.stopPropagation();
        openEventModal(event, true);
      });

      if (isOwner) {
        chip.draggable = true;

        chip.addEventListener("dragstart", dragEvent => {
          dragEvent.stopPropagation();

          calendarDraggedEventId = String(event.id);
          calendarDraggedSourceDate = key;

          chip.classList.add("dragging");
          dragEvent.dataTransfer.effectAllowed = "move";
          dragEvent.dataTransfer.setData("application/x-calendar-event", String(event.id));
          dragEvent.dataTransfer.setData("application/x-calendar-reorder-date", key);
          dragEvent.dataTransfer.setData("application/x-calendar-copy", dragEvent.altKey ? "1" : "0");
          dragEvent.dataTransfer.effectAllowed = dragEvent.altKey ? "copyMove" : "move";
        });

        chip.addEventListener("dragend", () => {
          chip.classList.remove("dragging");
          cell.classList.remove("calendar-ordering");
          calendarDraggedEventId = null;
          calendarDraggedSourceDate = null;
        });

        enableCalendarEventReorderTouch(chip, event, eventBox, key);
      }

      eventBox.appendChild(chip);
    });

  });
}

function setTodoAccordion(open) {
  if (!todoAccordionToggle || !todoAccordionBody) return;

  todoAccordionToggle.setAttribute("aria-expanded", String(open));
  todoAccordionBody.classList.toggle("hidden", !open);
  todoAccordionToggle.classList.toggle("open", open);
}

todoAccordionToggle?.addEventListener("click", () => {
  const open = todoAccordionToggle.getAttribute("aria-expanded") !== "true";
  setTodoAccordion(open);
});

/* DAY PANEL */
async function openDayPanel(date) {
  if (!isOwner) return;
  const key = formatDateKey(date);

  if (dayPanel.classList.contains("open") && selectedRecordDate === key) {
    closeDayPanel();
    return;
  }

  selectedRecordDate = key;
  setTodoAccordion(false);

  if (todoAccordionLabel) {
    todoAccordionLabel.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일에 완료한 일`;
  }

  const weekdays = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
  selectedDateTitle.textContent = `${date.getFullYear()}. ${date.getMonth()+1}. ${date.getDate()}. ${weekdays[date.getDay()]}`;
  dayPanel.classList.add("open");

  await Promise.all([
    loadDayTodos(key),
    loadQuickDateMeta(key)
  ]);
}

function closeDayPanel() {
  dayPanel.classList.remove("open");
}

closeDayPanelButton.addEventListener("click", closeDayPanel);

/* DAY TODOS */
dayTodoForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isOwner || !selectedRecordDate) return;

  const title = dayTodoInput.value.trim();
  if (!title) return;

  const completedAt = new Date(`${selectedRecordDate}T12:00:00`).toISOString();

  const { error } = await dbClient
    .from("todos")
    .insert({
      title,
      target_date: selectedRecordDate,
      is_completed: true,
      completed_at: completedAt
    });

  if (error) {
    console.error("한 일 추가 오류:", error);
    return;
  }

  dayTodoInput.value = "";
  await loadDayTodos(selectedRecordDate);
});
async function loadDayTodos(date) {
  const [todosResult, quickResult] = await Promise.all([
    dbClient
      .from("todos")
      .select("*")
      .eq("target_date", date)
      .order("created_at"),
    dbClient
      .from("quick_todos")
      .select("*")
      .eq("is_completed", true)
      .order("completed_at")
  ]);

  dayTodoList.innerHTML = "";

  const completedDayTodos = (todosResult.data || [])
    .filter(todo => todo.is_completed)
    .map(todo => ({
      table: "todos",
      id: todo.id,
      title: todo.title,
      completed_at: todo.completed_at || todo.created_at
    }));

  const completedQuickTodos = (quickResult.data || [])
    .filter(item =>
      item.completed_at &&
      formatDateKey(new Date(item.completed_at)) === date
    )
    .map(item => ({
      table: "quick_todos",
      id: item.id,
      title: item.title,
      completed_at: item.completed_at
    }));

  const completedItems = [...completedDayTodos, ...completedQuickTodos]
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  if (!completedItems.length) {
    dayTodoList.innerHTML = '<p class="empty-text">아직 완료한 일이 없어요.</p>';
    return;
  }

  completedItems.forEach(item => {
    const row = document.createElement("div");
    row.className = "todo-row done completed-record-row unified-completed-row completed-movable-row";
    row.dataset.completedTable = item.table;
    row.dataset.completedId = item.id;

    const checkMark = document.createElement("span");
    checkMark.className = "completed-record-check";
    checkMark.textContent = "✓";

    const text = document.createElement("span");
    text.className = "completed-record-title";
    text.textContent = item.title;

    row.append(checkMark, text);

    if (isOwner) {
      row.draggable = true;
      row.title = "드래그해서 다른 날짜로 이동";

      row.addEventListener("dragstart", event => {
        if (event.target.closest("button")) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/x-completed-item",
          completedPayload(item.table, item.id, item.title)
        );
      });

      enableCompletedTouchMove(row, item);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "row-delete";
      del.textContent = "×";
      del.title = "완료 기록 삭제";
      del.setAttribute("aria-label", `${item.title} 삭제`);

      del.addEventListener("click", async () => {
        const { error } = await dbClient
          .from(item.table)
          .delete()
          .eq("id", item.id);

        if (error) {
          console.error("완료 기록 삭제 오류:", error);
          return;
        }

        await loadDayTodos(date);
        if (item.table === "quick_todos") await loadQuickTodos();
      });

      row.appendChild(del);
    }

    dayTodoList.appendChild(row);
  });
}

function clearQuickTodoAutofill() {
  if (!quickTodoInput) return;

  quickTodoInput.value = "";

  // Some browsers/password managers inject remembered account text
  // shortly after page restore, so clear it once more after rendering.
  window.setTimeout(() => {
    if (document.activeElement !== quickTodoInput) {
      quickTodoInput.value = "";
    }
  }, 120);
}

let quickTodoDragId = null;

async function saveQuickTodoOrderFromDom() {
  if (!isOwner) return;

  const rows = [...quickTodoList.querySelectorAll(".quick-item[data-quick-todo-id]")];
  if (!rows.length) return;

  // 중요 항목은 항상 위쪽 그룹으로 유지한다.
  const ids = rows.map(row => Number(row.dataset.quickTodoId));
  const { data, error } = await dbClient
    .from("quick_todos")
    .select("id,is_important")
    .in("id", ids);

  if (error) {
    console.error("QUICK TODO 순서 저장 준비 오류:", error);
    await loadQuickTodos();
    return;
  }

  const importantMap = new Map((data || []).map(item => [Number(item.id), Boolean(item.is_important)]));
  const importantIds = ids.filter(id => importantMap.get(id));
  const normalIds = ids.filter(id => !importantMap.get(id));
  const orderedIds = [...importantIds, ...normalIds];

  const updates = orderedIds.map((id, index) =>
    dbClient
      .from("quick_todos")
      .update({ sort_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find(result => result.error);

  if (failed) {
    console.error("QUICK TODO 순서 저장 오류:", failed.error);
  }

  await loadQuickTodos();
}

/* QUICK TODOS */
quickTodoAddButton.addEventListener("click", addQuickTodo);
quickTodoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addQuickTodo();
});

async function addQuickTodo() {
  if (!isOwner) return;
  const title = quickTodoInput.value.trim();
  if (!title) return;

  const { data: existingRows, error: orderError } = await dbClient
    .from("quick_todos")
    .select("sort_order")
    .eq("is_completed", false)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (orderError) {
    console.error("QUICK TODO 순서 확인 오류:", orderError);
    return;
  }

  const nextOrder = existingRows?.length
    ? (Number(existingRows[0].sort_order) || 0) + 1
    : 0;

  const { error } = await dbClient.from("quick_todos").insert({
    title,
    is_completed: false,
    is_important: false,
    sort_order: nextOrder
  });

  if (!error) {
    quickTodoInput.value = "";
    loadQuickTodos();
  } else {
    console.error("QUICK TODO 추가 오류:", error);
  }
}

async function loadQuickTodos() {
  const { data, error } = await dbClient
    .from("quick_todos")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("QUICK TODO 불러오기 오류:", error);
    return;
  }

  const rows = data || [];
  const todayKey = formatDateKey(new Date());

  const active = rows
    .filter(item => !item.is_completed)
    .sort((a, b) => {
      const importantDiff = Number(Boolean(b.is_important)) - Number(Boolean(a.is_important));
      if (importantDiff !== 0) return importantDiff;

      const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
      const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
      if (orderA !== orderB) return orderA - orderB;

      return new Date(a.created_at) - new Date(b.created_at);
    });

  // 메인의 완료 목록은 '오늘 완료한 것'만 보여준다.
  const completedToday = rows
    .filter(item =>
      item.is_completed &&
      item.completed_at &&
      formatDateKey(new Date(item.completed_at)) === todayKey
    )
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  quickTodoList.innerHTML = "";

  if (!active.length) {
    quickTodoList.innerHTML = '<p class="empty-text">아직 등록된 할 일이 없어요.</p>';
  } else {
    active.forEach(item => quickTodoList.appendChild(makeQuickTodoRow(item, false)));
  }

  quickTodoCompletedList.innerHTML = "";

  if (!completedToday.length) {
    quickTodoCompletedList.innerHTML = '<p class="empty-text">오늘 완료한 일이 없어요.</p>';
  } else {
    completedToday.forEach(item =>
      quickTodoCompletedList.appendChild(makeQuickTodoRow(item, true))
    );
  }

  lastQuickTodoDateKey = todayKey;
}

function makeQuickTodoRow(item, completed) {
  const row = document.createElement("div");
  row.className = `quick-item ${completed ? "quick-item-completed" : ""}`;
  row.dataset.quickTodoId = item.id;

  if (completed && isOwner) {
    row.draggable = true;
    row.classList.add("completed-movable-row");
    row.title = "드래그해서 다른 날짜로 이동";

    row.addEventListener("dragstart", event => {
      if (event.target.closest("button, input, .quick-item-editable")) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/x-completed-item",
        completedPayload("quick_todos", item.id, item.title)
      );
    });

    enableCompletedTouchMove(row, {
      table: "quick_todos",
      id: item.id,
      title: item.title
    });
  }

  if (!completed && isOwner) {
    row.draggable = true;
    row.classList.add("quick-item-draggable");

    row.addEventListener("dragstart", (event) => {
      // 텍스트 클릭은 수정 동작으로 남겨두고, 버튼/체크박스에서도 드래그하지 않는다.
      if (event.target.closest("button, input, .quick-item-content")) {
        event.preventDefault();
        return;
      }

      quickTodoDragId = String(item.id);
      row.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(item.id));
    });

    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const dragging = quickTodoList.querySelector(".quick-item.dragging");
      if (!dragging || dragging === row) return;

      const rect = row.getBoundingClientRect();
      const placeAfter = event.clientY > rect.top + rect.height / 2;
      quickTodoList.insertBefore(dragging, placeAfter ? row.nextSibling : row);
    });

    row.addEventListener("drop", async (event) => {
      event.preventDefault();
      await saveQuickTodoOrderFromDom();
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");
      quickTodoDragId = null;
      await saveQuickTodoOrderFromDom();
    });
  }

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = completed;
  check.disabled = !isOwner;
  check.title = completed ? "체크 해제하면 다시 해야 하는 일로 돌아가요." : "완료";

  check.addEventListener("change", async () => {
    const { error } = await dbClient.from("quick_todos").update({
      is_completed: check.checked,
      completed_at: check.checked ? new Date().toISOString() : null
    }).eq("id", item.id);

    if (error) {
      console.error("QUICK TODO 상태 변경 오류:", error);
      check.checked = !check.checked;
      return;
    }

    await loadQuickTodos();

    if (selectedRecordDate) {
      await loadDayTodos(selectedRecordDate);
    }
  });

  const starButton = document.createElement("button");
  starButton.type = "button";
  starButton.className = `quick-star-button ${item.is_important ? "active" : ""}`;
  starButton.textContent = item.is_important ? "★" : "☆";
  starButton.title = item.is_important ? "중요 표시 해제" : "중요 표시";
  starButton.setAttribute("aria-label", starButton.title);
  starButton.disabled = !isOwner;

  starButton.addEventListener("click", async () => {
    if (!isOwner) return;

    const nextImportant = !Boolean(item.is_important);
    starButton.disabled = true;

    const { error } = await dbClient
      .from("quick_todos")
      .update({ is_important: nextImportant })
      .eq("id", item.id);

    if (error) {
      console.error("QUICK TODO 중요 표시 오류:", error);
      starButton.disabled = false;
      return;
    }

    await loadQuickTodos();
  });

  const content = document.createElement("div");
  content.className = "quick-item-content quick-item-editable";
  content.title = isOwner ? "클릭해서 수정" : "";

  const text = document.createElement("span");
  text.className = "quick-item-title";
  text.textContent = item.title;
  content.appendChild(text);

  if (completed && item.completed_at) {
    const time = document.createElement("span");
    time.className = "quick-item-time";
    time.textContent = formatDateTime(item.completed_at);
    content.appendChild(time);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "quick-delete-button";
  deleteButton.textContent = "×";
  deleteButton.title = "삭제";
  deleteButton.setAttribute("aria-label", `${item.title} 삭제`);
  deleteButton.disabled = !isOwner;

  const beginEditing = () => {
    if (!isOwner || row.classList.contains("editing")) return;

    row.classList.add("editing");
    row.draggable = false;
    check.disabled = true;
    starButton.disabled = true;
    deleteButton.disabled = true;

    const originalTitle = item.title;

    const editor = document.createElement("div");
    editor.className = "quick-inline-editor";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "quick-inline-input";
    input.value = originalTitle;
    input.maxLength = 120;
    input.autocomplete = "off";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "quick-inline-save";
    saveButton.textContent = "저장";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "quick-inline-cancel";
    cancelButton.textContent = "취소";

    const finishEditing = () => {
      row.classList.remove("editing");
      row.draggable = !completed && isOwner;
      check.disabled = !isOwner;
      starButton.disabled = !isOwner;
      deleteButton.disabled = !isOwner;
      editor.remove();
      content.classList.remove("hidden");
    };

    const saveEditing = async () => {
      const nextTitle = input.value.trim();

      if (!nextTitle) {
        input.focus();
        return;
      }

      saveButton.disabled = true;

      const { error } = await dbClient
        .from("quick_todos")
        .update({ title: nextTitle })
        .eq("id", item.id);

      if (error) {
        console.error("QUICK TODO 수정 오류:", error);
        saveButton.disabled = false;
        return;
      }

      await loadQuickTodos();

      if (selectedRecordDate) {
        await loadDayTodos(selectedRecordDate);
      }
    };

    saveButton.addEventListener("click", saveEditing);
    cancelButton.addEventListener("click", finishEditing);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveEditing();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        finishEditing();
      }
    });

    editor.append(input, saveButton, cancelButton);
    content.classList.add("hidden");
    row.insertBefore(editor, completed ? deleteButton : starButton);

    input.focus();
    input.select();
  };

  content.addEventListener("click", beginEditing);

  deleteButton.addEventListener("click", async () => {
    if (!isOwner) return;
    if (!window.confirm(`"${item.title}"을(를) 삭제할까요?`)) return;

    const { error } = await dbClient
      .from("quick_todos")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("QUICK TODO 삭제 오류:", error);
      return;
    }

    await loadQuickTodos();

    if (selectedRecordDate) {
      await loadDayTodos(selectedRecordDate);
    }
  });

  if (!completed) {
    // 지금 해야 하는 일: 체크 → 텍스트 → 별 → X
    row.append(check, content, starButton, deleteButton);

    enableLongPressReorder(
      row,
      quickTodoList,
      saveQuickTodoOrderFromDom,
      {
        targetSelector: ".quick-item[data-quick-todo-id]",
        excludeSelector: "button, input, .quick-item-content"
      }
    );
  } else {
    // 오늘 완료한 일: 체크 → 텍스트 → X
    row.append(check, content, deleteButton);
  }

  return row;
}

/* DATE META: MOOD + PERIOD */
async function loadQuickDateMeta(date) {
  const [moodResult, periodResult] = await Promise.all([
    dbClient.from("moods").select("*").eq("record_date", date).maybeSingle(),
    dbClient.from("period_records").select("*").lte("start_date", date).gte("end_date", date)
  ]);

  setMoodPickerValue(moodResult.data?.mood_type || "");

  const periodRecord = (periodResult.data || [])[0] || null;
  currentPeriodRecordId = periodRecord?.id || null;
  periodCheck.checked = Boolean(periodRecord);

  moodPickerButton.disabled = !isOwner;
  periodCheck.disabled = !isOwner;
}

moodPickerButton.addEventListener("click", () => {
  if (!isOwner) return;
  const open = moodPickerMenu.classList.contains("hidden");
  moodPickerMenu.classList.toggle("hidden", !open);
  moodPickerButton.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  if (!moodPicker.contains(event.target)) {
    moodPickerMenu.classList.add("hidden");
    moodPickerButton.setAttribute("aria-expanded", "false");
  }
});

moodPickerMenu.querySelectorAll("[data-mood]").forEach(button => {
  button.addEventListener("click", async () => {
    if (!isOwner || !selectedRecordDate) return;

    const nextMood = button.dataset.mood;
    quickMetaSaveState.textContent = "저장 중...";

    let result;

    if (!nextMood) {
      result = await dbClient
        .from("moods")
        .delete()
        .eq("record_date", selectedRecordDate);
    } else {
      result = await dbClient
        .from("moods")
        .upsert({
          record_date: selectedRecordDate,
          mood_type: nextMood,
          reason: null
        }, { onConflict: "record_date" });
    }

    if (result.error) {
      console.error("기분 저장 오류:", result.error);
      quickMetaSaveState.textContent = "저장 실패";
      return;
    }

    setMoodPickerValue(nextMood);
    moodPickerMenu.classList.add("hidden");
    moodPickerButton.setAttribute("aria-expanded", "false");
    quickMetaSaveState.textContent = "저장됨";

    renderCalendar();
    window.setTimeout(() => {
      if (quickMetaSaveState.textContent === "저장됨") quickMetaSaveState.textContent = "";
    }, 900);
  });
});

periodCheck.addEventListener("change", async () => {
  if (!isOwner || !selectedRecordDate) return;

  quickMetaSaveState.textContent = "저장 중...";

  let result;

  if (periodCheck.checked) {
    result = await dbClient.from("period_records").insert({
      start_date: selectedRecordDate,
      end_date: selectedRecordDate
    });
  } else {
    result = await dbClient
      .from("period_records")
      .delete()
      .eq("start_date", selectedRecordDate)
      .eq("end_date", selectedRecordDate);
  }

  quickMetaSaveState.textContent = result.error ? "저장 실패" : "저장됨";

  if (result.error) {
    periodCheck.checked = !periodCheck.checked;
  } else {
    renderCalendar();
    window.setTimeout(() => quickMetaSaveState.textContent = "", 800);
  }
});

/* EVENTS */
function openEventModal(eventData = {}, allowEdit = false) {
  const existing = Boolean(eventData.id);
  editingEventOriginalStartDate = eventData.start_date || null;
  editingEventSortOrder = Number.isFinite(Number(eventData.sort_order))
    ? Number(eventData.sort_order)
    : null;

  eventIdInput.value = eventData.id || "";
  eventTitleInput.value = eventData.title || "";
  eventStartInput.value = eventData.start_date || formatDateKey(new Date());
  eventEndInput.value = eventData.end_date || eventStartInput.value;
  eventDescriptionInput.value = eventData.description || "";
  const selectedColor = eventData.color_variant === "pink" ? "pink" : "blue";
  eventColorInputs.forEach(input => {
    input.checked = input.value === selectedColor;
  });
  eventModalMessage.textContent = "";

  const canEdit = isOwner;
  eventModalTitle.textContent = existing ? (canEdit ? "일정 수정" : "일정 보기") : "일정 추가";

  [eventTitleInput, eventStartInput, eventEndInput, eventDescriptionInput, ...eventColorInputs].forEach(input => {
    input.disabled = !canEdit;
  });

  eventDeleteButton.classList.toggle("hidden", !existing || !canEdit);
  eventModalForm.querySelector('button[type="submit"]').classList.toggle("hidden", !canEdit);

  eventModal.classList.remove("hidden");

  // 캘린더 클릭/드래그 직후 바로 일정명을 타이핑할 수 있게 한다.
  if (!existing && canEdit) {
    window.setTimeout(() => {
      eventTitleInput.focus();
      eventTitleInput.select();
    }, 0);
  }
}

function closeEventModal() {
  eventModal.classList.add("hidden");
  eventModalForm.reset();
  eventIdInput.value = "";
}

eventModalCloseButton.addEventListener("click", closeEventModal);
eventCancelButton.addEventListener("click", closeEventModal);

eventStartInput.addEventListener("change", () => {
  if (!eventEndInput.value || eventEndInput.value < eventStartInput.value) {
    eventEndInput.value = eventStartInput.value;
  }
});

eventModalForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isOwner) return;

  const payload = {
    title: eventTitleInput.value.trim(),
    start_date: eventStartInput.value,
    end_date: eventEndInput.value,
    description: eventDescriptionInput.value.trim() || null,
    color_variant: eventColorInputs.find(input => input.checked)?.value || "blue"
  };

  if (!payload.title) return;

  if (payload.end_date < payload.start_date) {
    eventModalMessage.textContent = "종료일은 시작일보다 빠를 수 없어요.";
    return;
  }

  payload.is_completed = payload.start_date < formatDateKey(new Date());

  const isEditing = Boolean(eventIdInput.value);
  const movedDate = isEditing && editingEventOriginalStartDate !== payload.start_date;

  if (!isEditing || movedDate || editingEventSortOrder == null) {
    payload.sort_order = await getNextScheduleOrder(payload.start_date);
  } else {
    payload.sort_order = editingEventSortOrder;
  }

  let result;

  if (isEditing) {
    result = await dbClient
      .from("events")
      .update(payload)
      .eq("id", Number(eventIdInput.value));
  } else {
    result = await dbClient
      .from("events")
      .insert(payload);
  }

  if (result.error) {
    console.error("일정 저장 오류:", result.error);
    eventModalMessage.textContent = "저장하지 못했어요.";
    return;
  }

  closeEventModal();
  await loadSchedulePage();
  renderCalendar();
});

eventDeleteButton.addEventListener("click", async () => {
  if (!isOwner || !eventIdInput.value) return;
  if (!confirm("이 일정을 삭제할까요?")) return;

  const result = await dbClient.from("events").delete().eq("id", Number(eventIdInput.value));
  if(result.error) {eventModalMessage.textContent='삭제하지 못했어요.'; return;}

  closeEventModal();
  loadSchedulePage();
  renderCalendar();
});

openScheduleCreateButton.addEventListener("click", () => {
  if (!isOwner) return;
  openEventModal();
});



function daysBetweenKeys(startKey, endKey) {
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  return Math.round((end - start) / 86400000);
}

function addDaysToKey(key, days) {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

async function copyEventToDate(eventId, targetDate) {
  if (!isOwner || !eventId || !targetDate) return;

  const { data: source, error: fetchError } = await dbClient
    .from("events")
    .select("*")
    .eq("id", Number(eventId))
    .single();

  if (fetchError || !source) {
    console.error("복사할 일정 불러오기 오류:", fetchError);
    return;
  }

  const duration = Math.max(0, daysBetweenKeys(source.start_date, source.end_date));
  const newEndDate = addDaysToKey(targetDate, duration);
  const nextOrder = await getNextScheduleOrder(targetDate);
  const todayKey = formatDateKey(new Date());

  const { error } = await dbClient
    .from("events")
    .insert({
      title: source.title,
      start_date: targetDate,
      end_date: newEndDate,
      description: source.description || null,
      sort_order: nextOrder,
      is_completed: targetDate < todayKey,
      color_variant: source.color_variant === "pink" ? "pink" : "blue"
    });

  if (error) {
    console.error("일정 복사 오류:", error);
    return;
  }

  await loadSchedulePage();
  renderCalendar();
}

async function moveEventToDate(eventId, targetDate) {
  if (!isOwner || !eventId || !targetDate) return;

  const { data: eventData, error: fetchError } = await dbClient
    .from("events")
    .select("*")
    .eq("id", Number(eventId))
    .single();

  if (fetchError || !eventData) {
    console.error("일정 이동 대상 불러오기 오류:", fetchError);
    return;
  }

  const duration = Math.max(0, daysBetweenKeys(eventData.start_date, eventData.end_date));
  const newEndDate = addDaysToKey(targetDate, duration);
  const todayKey = formatDateKey(new Date());
  const nextOrder = await getNextScheduleOrder(targetDate);

  const { error } = await dbClient
    .from("events")
    .update({
      start_date: targetDate,
      end_date: newEndDate,
      sort_order: nextOrder,
      is_completed: targetDate < todayKey
    })
    .eq("id", Number(eventId));

  if (error) {
    console.error("일정 날짜 이동 오류:", error);
    return;
  }

  await loadSchedulePage();
  renderCalendar();
}

function enableScheduleEventTouchMove(row, eventData) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let ghostApi = null;
  let highlightedGroup = null;
  let highlightedRow = null;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const clearHighlights = () => {
    highlightedGroup?.classList.remove("touch-drop-target");
    highlightedRow?.classList.remove("touch-reorder-target");
    highlightedGroup = null;
    highlightedRow = null;
  };

  const reset = () => {
    clearTimer();
    active = false;
    scheduleTouchDragging = false;
    row.classList.remove("touch-dragging", "dragging");
    ghostApi?.ghost.remove();
    ghostApi = null;
    clearHighlights();
  };

  row.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;
    if (event.target.closest("button")) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      scheduleTouchDragging = true;
      row.classList.add("touch-dragging", "dragging");
      ghostApi = createDragGhost(row, lastX, lastY);
      navigator.vibrate?.(25);
    }, 430);
  }, { passive: true });

  row.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();
    ghostApi?.move(lastX, lastY);

    const element = document.elementFromPoint(lastX, lastY);
    const group = element?.closest(".schedule-date-group") || null;
    const targetRow = element?.closest(".schedule-entry[data-kind][data-id]") || null;

    if (group !== highlightedGroup) {
      highlightedGroup?.classList.remove("touch-drop-target");
      highlightedGroup = group;
      highlightedGroup?.classList.add("touch-drop-target");
    }

    if (targetRow !== highlightedRow) {
      highlightedRow?.classList.remove("touch-reorder-target");
      highlightedRow = targetRow && targetRow !== row ? targetRow : null;
      highlightedRow?.classList.add("touch-reorder-target");
    }

    // 같은 날짜 그룹 안에서는 순서도 동시에 바꿀 수 있다.
    if (highlightedGroup?.dataset.scheduleDate === eventData.start_date && highlightedRow) {
      const body = highlightedGroup.querySelector(".schedule-group-body");
      const rect = highlightedRow.getBoundingClientRect();
      const after = lastY > rect.top + rect.height / 2;
      body.insertBefore(row, after ? highlightedRow.nextSibling : highlightedRow);
    }
  }, { passive: false });

  const finish = async event => {
    clearTimer();
    if (!active) return;

    if (event.cancelable) event.preventDefault();

    const targetDate = highlightedGroup?.dataset.scheduleDate || null;
    const originalDate = eventData.start_date;

    if (targetDate && targetDate !== originalDate) {
      reset();
      await moveEventToDate(eventData.id, targetDate);
      return;
    }

    const group = row.closest(".schedule-date-group");
    reset();

    if (group) {
      await saveScheduleGroupOrderFromDom(group);
    }
  };

  row.addEventListener("touchend", finish, { passive: false });
  row.addEventListener("touchcancel", finish, { passive: false });
}

function enableCalendarEventTouchMove(chip, eventData) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let ghostApi = null;
  let highlighted = null;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  chip.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      suppressCalendarClickUntil = Date.now() + 1000;
      chip.classList.add("touch-dragging");
      ghostApi = createDragGhost(chip, lastX, lastY);
      navigator.vibrate?.(25);
    }, 430);
  }, { passive: true });

  chip.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();
    ghostApi?.move(lastX, lastY);

    const cell = document.elementFromPoint(lastX, lastY)?.closest(".calendar-day");
    if (cell !== highlighted) {
      highlighted?.classList.remove("touch-drop-target");
      highlighted = cell || null;
      highlighted?.classList.add("touch-drop-target");
    }
  }, { passive: false });

  const finish = async event => {
    clearTimer();
    if (!active) return;

    if (event.cancelable) event.preventDefault();

    const targetDate = highlighted?.dataset.date || null;

    active = false;
    chip.classList.remove("touch-dragging");
    ghostApi?.ghost.remove();
    ghostApi = null;
    highlighted?.classList.remove("touch-drop-target");
    highlighted = null;

    if (targetDate && targetDate !== eventData.start_date) {
      await moveEventToDate(eventData.id, targetDate);
    }
  };

  chip.addEventListener("touchend", finish, { passive: false });
  chip.addEventListener("touchcancel", finish, { passive: false });
}


async function saveCalendarEventOrderForDate(date, orderedIds) {
  if (!isOwner || !date || !orderedIds?.length) return;

  // 캘린더에서 바꾼 순서를 일정탭과 공유한다.
  const eventUpdates = orderedIds.map((id, index) =>
    dbClient
      .from("events")
      .update({ sort_order: (index + 1) * 1000 })
      .eq("id", Number(id))
  );

  const eventResults = await Promise.all(eventUpdates);
  const eventFailed = eventResults.find(result => result.error);

  if (eventFailed) {
    console.error("캘린더 일정 순서 저장 오류:", eventFailed.error);
    return;
  }

  // 캘린더에서 순서를 바꾸면 그날 메모는 모두 일정 하단으로 보낸다.
  const { data: notes, error: notesError } = await dbClient
    .from("schedule_notes")
    .select("id,sort_order,created_at")
    .eq("note_date", date)
    .order("sort_order")
    .order("created_at");

  if (notesError) {
    console.error("메모 순서 불러오기 오류:", notesError);
  } else if (notes?.length) {
    const base = (orderedIds.length + 1) * 1000;

    const noteResults = await Promise.all(
      notes.map((note, index) =>
        dbClient
          .from("schedule_notes")
          .update({ sort_order: base + index * 1000 })
          .eq("id", note.id)
      )
    );

    const noteFailed = noteResults.find(result => result.error);
    if (noteFailed) console.error("메모 하단 정렬 오류:", noteFailed.error);
  }

  await loadSchedulePage();
  renderCalendar();
}

function enableCalendarEventReorderTouch(chip, eventData, eventBox, dateKey) {
  if (!isOwner) return;

  let timer = null;
  let active = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let ghostApi = null;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const reset = () => {
    clearTimer();
    active = false;
    chip.classList.remove("touch-dragging", "dragging");
    ghostApi?.ghost.remove();
    ghostApi = null;
  };

  chip.addEventListener("touchstart", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = lastY = touch.clientY;

    clearTimer();
    timer = window.setTimeout(() => {
      active = true;
      suppressCalendarClickUntil = Date.now() + 1000;
      chip.classList.add("touch-dragging", "dragging");
      ghostApi = createDragGhost(chip, lastX, lastY);
      navigator.vibrate?.(25);
    }, 430);
  }, { passive: true });

  chip.addEventListener("touchmove", event => {
    if (!event.touches?.length) return;

    const touch = event.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;

    if (!active) {
      if (Math.hypot(lastX - startX, lastY - startY) > 18) clearTimer();
      return;
    }

    if (event.cancelable) event.preventDefault();
    ghostApi?.move(lastX, lastY);

    const element = document.elementFromPoint(lastX, lastY);
    const targetCell = element?.closest(".calendar-day");
    const targetChip = element?.closest(".calendar-event-chip");

    // 같은 날짜 칸 안에서는 칩 자체 또는 빈 공간을 기준으로 순서를 변경한다.
    if (targetCell?.dataset.date === dateKey) {
      if (targetChip && targetChip !== chip && eventBox.contains(targetChip)) {
        const rect = targetChip.getBoundingClientRect();
        const after = lastY > rect.top + rect.height / 2;
        eventBox.insertBefore(chip, after ? targetChip.nextSibling : targetChip);
      } else if (targetCell.querySelector(".calendar-event-list") === eventBox) {
        const rect = eventBox.getBoundingClientRect();
        if (lastY > rect.top + rect.height / 2) eventBox.appendChild(chip);
      }
    }
  }, { passive: false });

  const finish = async event => {
    clearTimer();
    if (!active) return;

    if (event.cancelable) event.preventDefault();

    const dropCell = document.elementFromPoint(lastX, lastY)?.closest(".calendar-day");
    const dropDate = dropCell?.dataset.date || null;

    if (dropDate && dropDate !== dateKey) {
      reset();
      await moveEventToDate(eventData.id, dropDate);
      return;
    }

    const ids = [...eventBox.querySelectorAll(".calendar-event-chip[data-event-id]")]
      .map(el => Number(el.dataset.eventId));

    reset();

    if (ids.length) await saveCalendarEventOrderForDate(dateKey, ids);
  };

  chip.addEventListener("touchend", finish, { passive: false });
  chip.addEventListener("touchcancel", finish, { passive: false });
}

function enableScheduleNoteTouchReorder(row, group) {
  if (!isOwner) return;

  enableLongPressReorder(
    row,
    group.querySelector(".schedule-group-body"),
    () => saveScheduleGroupOrderFromDom(group),
    {
      targetSelector: ".schedule-entry[data-kind][data-id]",
      excludeSelector: "button"
    }
  );
}

function formatScheduleDateHeading(key) {
  const date = parseLocalDate(key);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}요일`;
}

async function getNextScheduleOrder(date) {
  const [eventsResult, notesResult] = await Promise.all([
    dbClient.from("events").select("sort_order").eq("start_date", date),
    dbClient.from("schedule_notes").select("sort_order").eq("note_date", date)
  ]);

  const values = [
    ...(eventsResult.data || []).map(item => Number(item.sort_order) || 0),
    ...(notesResult.data || []).map(item => Number(item.sort_order) || 0)
  ];

  return (values.length ? Math.max(...values) : 0) + 1000;
}

async function saveScheduleGroupOrderFromDom(group) {
  if (!isOwner || !group) return;

  const entries = [...group.querySelectorAll(".schedule-entry[data-kind][data-id]")];

  const requests = entries.map((entry, index) => {
    const sortOrder = (index + 1) * 1000;
    const table = entry.dataset.kind === "event" ? "events" : "schedule_notes";

    return dbClient
      .from(table)
      .update({ sort_order: sortOrder })
      .eq("id", Number(entry.dataset.id));
  });

  const results = await Promise.all(requests);
  const failed = results.find(result => result.error);

  if (failed) console.error("일정 순서 저장 오류:", failed.error);

  await loadSchedulePage();
  renderCalendar();
}

function renderScheduleGap(date, beforeItem, afterItem, group) {
  const gap = document.createElement("div");
  gap.className = "schedule-gap owner-control";
  gap.title = "클릭: 메모 추가 · 더블클릭: 일정 추가";

  const line = document.createElement("span");
  line.className = "schedule-gap-line";

  const hint = document.createElement("span");
  hint.className = "schedule-gap-hint";
  hint.textContent = "+ 메모 / 더블클릭 일정";

  gap.append(line, hint);

  if (!isOwner) {
    gap.classList.add("hidden");
    return gap;
  }

  let clickTimer = null;

  const calculateInsertOrder = () => {
    const beforeOrder = Number(beforeItem?.sort_order) || 0;
    const afterOrder = Number(afterItem?.sort_order) || (beforeOrder + 2000);

    let sortOrder = Math.floor((beforeOrder + afterOrder) / 2);
    if (sortOrder <= beforeOrder) sortOrder = beforeOrder + 1;

    return sortOrder;
  };

  const restoreGap = () => {
    gap.classList.remove("editing", "editing-event");
    gap.replaceChildren(line, hint);
  };

  const openMemoEditor = () => {
    if (gap.classList.contains("editing")) return;

    gap.classList.add("editing");
    gap.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "schedule-gap-input";
    input.maxLength = 300;
    input.placeholder = "이 사이에 메모 남기기";

    let isSaving = false;
    let isFinished = false;

    const cancel = () => {
      if (isSaving || isFinished) return;
      restoreGap();
    };

    const save = async () => {
      if (isSaving || isFinished) return;

      const body = input.value.trim();
      if (!body) {
        restoreGap();
        return;
      }

      isSaving = true;
      input.disabled = true;

      const { error } = await dbClient
        .from("schedule_notes")
        .insert({
          note_date: date,
          body,
          sort_order: calculateInsertOrder()
        });

      if (error) {
        console.error("일정 사이 메모 저장 오류:", error);
        isSaving = false;
        input.disabled = false;
        return;
      }

      isFinished = true;
      await loadSchedulePage();
    };

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        save();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });

    input.addEventListener("blur", () => {
      if (isSaving || isFinished) return;
      if (input.value.trim()) save();
      else restoreGap();
    }, { once: true });

    gap.appendChild(input);
    input.focus();
  };

  const openEventEditor = () => {
    if (gap.classList.contains("editing")) return;

    gap.classList.add("editing", "editing-event");
    gap.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "schedule-gap-input schedule-gap-event-input";
    input.maxLength = 120;
    input.placeholder = "이 위치에 일정 추가";

    let isSaving = false;
    let isFinished = false;

    const cancel = () => {
      if (isSaving || isFinished) return;
      restoreGap();
    };

    const save = async () => {
      if (isSaving || isFinished) return;

      const title = input.value.trim();
      if (!title) {
        restoreGap();
        return;
      }

      isSaving = true;
      input.disabled = true;

      const todayKey = formatDateKey(new Date());

      const { error } = await dbClient
        .from("events")
        .insert({
          title,
          start_date: date,
          end_date: date,
          description: null,
          sort_order: calculateInsertOrder(),
          is_completed: date < todayKey,
          color_variant: "blue"
        });

      if (error) {
        console.error("일정 사이 빠른 일정 추가 오류:", error);
        isSaving = false;
        input.disabled = false;
        return;
      }

      isFinished = true;
      await loadSchedulePage();
      renderCalendar();
    };

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        save();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });

    input.addEventListener("blur", () => {
      if (isSaving || isFinished) return;
      if (input.value.trim()) save();
      else restoreGap();
    }, { once: true });

    gap.appendChild(input);
    input.focus();
  };

  gap.addEventListener("click", event => {
    event.stopPropagation();

    if (gap.classList.contains("editing")) return;

    // dblclick과 충돌하지 않도록 단일 클릭 실행을 잠깐 미룬다.
    if (clickTimer) window.clearTimeout(clickTimer);

    clickTimer = window.setTimeout(() => {
      clickTimer = null;
      openMemoEditor();
    }, 240);
  });

  gap.addEventListener("dblclick", event => {
    event.preventDefault();
    event.stopPropagation();

    if (clickTimer) {
      window.clearTimeout(clickTimer);
      clickTimer = null;
    }

    if (gap.classList.contains("editing")) {
      restoreGap();
    }

    openEventEditor();
  });

  if (isOwner) {
    gap.addEventListener("dragover", event => {
      const body = group.querySelector(".schedule-group-body");
      const dragging = body.querySelector(".schedule-entry.dragging");
      if (!dragging) return;

      event.preventDefault();
      gap.classList.add("schedule-gap-drop-target");
    });

    gap.addEventListener("dragleave", () => {
      gap.classList.remove("schedule-gap-drop-target");
    });

    gap.addEventListener("drop", async event => {
      const body = group.querySelector(".schedule-group-body");
      const dragging = body.querySelector(".schedule-entry.dragging");
      if (!dragging) return;

      event.preventDefault();
      event.stopPropagation();
      gap.classList.remove("schedule-gap-drop-target");

      const nextEntry = gap.nextElementSibling?.matches(".schedule-entry")
        ? gap.nextElementSibling
        : null;

      body.insertBefore(dragging, nextEntry);
      await saveScheduleGroupOrderFromDom(group);
    });
  }

  return gap;
}

function renderScheduleNote(note, group) {
  const row = document.createElement("div");
  row.className = "schedule-entry schedule-note-row";
  row.dataset.kind = "note";
  row.dataset.id = note.id;
  row.dataset.sortOrder = note.sort_order;

  const dot = document.createElement("span");
  dot.className = "schedule-note-dot";

  const text = document.createElement("span");
  text.className = "schedule-note-text";
  text.textContent = note.body;

  const del = document.createElement("button");
  del.type = "button";
  del.className = "schedule-note-delete owner-control";
  del.textContent = "×";
  del.title = "메모 삭제";

  del.addEventListener("click", async () => {
    const { error } = await dbClient
      .from("schedule_notes")
      .delete()
      .eq("id", note.id);

    if (error) {
      console.error("일정 사이 메모 삭제 오류:", error);
      return;
    }

    await loadSchedulePage();
  });

  row.append(dot, text, del);

  if (isOwner && group) {
    row.draggable = true;

    row.addEventListener("dragstart", event => {
      if (event.target.closest("button")) {
        event.preventDefault();
        return;
      }

      row.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-schedule-note", String(note.id));
    });

    row.addEventListener("dragover", event => {
      const body = group.querySelector(".schedule-group-body");
      const dragging = body.querySelector(".schedule-entry.dragging");
      if (!dragging || dragging === row) return;

      event.preventDefault();

      const rect = row.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      body.insertBefore(dragging, after ? row.nextSibling : row);
    });

    row.addEventListener("drop", async event => {
      event.preventDefault();
      event.stopPropagation();
      await saveScheduleGroupOrderFromDom(group);
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");
      await saveScheduleGroupOrderFromDom(group);
    });

    enableScheduleNoteTouchReorder(row, group);
  }

  return row;
}

function renderScheduleEvent(event, todayKey, group) {
  const row = document.createElement("div");
  row.className = "schedule-entry schedule-item schedule-item-button";
  row.dataset.kind = "event";
  row.dataset.id = event.id;
  row.dataset.sortOrder = event.sort_order;

  if (event.is_completed || event.end_date < todayKey) {
    row.classList.add("schedule-item-past");
  }

  const dragHandle = document.createElement("span");
  dragHandle.className = "schedule-drag-handle owner-control";
  dragHandle.textContent = "⋮⋮";
  dragHandle.title = "드래그해서 순서 변경";

  const text = document.createElement("button");
  text.type = "button";
  text.className = "schedule-event-main";

  const strong = document.createElement("strong");
  strong.textContent = event.title;
  text.appendChild(strong);

  if (event.end_date !== event.start_date) {
    const range = document.createElement("span");
    range.className = "schedule-event-range";
    range.textContent = `~ ${niceDate(event.end_date)}`;
    text.appendChild(range);
  }

  if (event.description) {
    const desc = document.createElement("span");
    desc.className = "schedule-event-description";
    desc.textContent = event.description;
    text.appendChild(desc);
  }

  text.addEventListener("click", () => {
    if (scheduleTouchDragging) return;
    openEventModal(event, true);
  });

  row.append(dragHandle, text);

  if (isOwner) {
    row.draggable = true;

    row.addEventListener("dragstart", eventObject => {
      if (eventObject.target.closest("button")) {
        eventObject.preventDefault();
        return;
      }

      row.classList.add("dragging");
      eventObject.dataTransfer.effectAllowed = "move";
      eventObject.dataTransfer.setData("text/plain", String(event.id));
      eventObject.dataTransfer.setData("application/x-schedule-event", String(event.id));
    });

    row.addEventListener("dragover", eventObject => {
      eventObject.preventDefault();
      const dragging = group.querySelector(".schedule-entry.dragging");
      if (!dragging || dragging === row) return;

      const rect = row.getBoundingClientRect();
      const after = eventObject.clientY > rect.top + rect.height / 2;
      group.querySelector(".schedule-group-body").insertBefore(
        dragging,
        after ? row.nextSibling : row
      );
    });

    row.addEventListener("drop", async eventObject => {
      eventObject.preventDefault();
      eventObject.stopPropagation();

      const movedEventId = eventObject.dataTransfer.getData("application/x-schedule-event");
      const targetDate = group.dataset.scheduleDate;

      if (movedEventId && targetDate !== event.start_date) {
        await moveEventToDate(movedEventId, targetDate);
        return;
      }

      await saveScheduleGroupOrderFromDom(group);
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");
      await saveScheduleGroupOrderFromDom(group);
    });

    enableScheduleEventTouchMove(row, event);
  }

  return row;
}

/* SCHEDULE PAGE */
async function loadSchedulePage({ scrollToToday = false } = {}) {
  const [eventsResult, notesResult] = await Promise.all([
    dbClient
      .from("events")
      .select("*")
      .order("start_date")
      .order("sort_order")
      .order("created_at"),
    dbClient
      .from("schedule_notes")
      .select("*")
      .order("note_date")
      .order("sort_order")
      .order("created_at")
  ]);

  scheduleList.innerHTML = "";

  if (eventsResult.error || notesResult.error) {
    console.error("일정 불러오기 오류:", eventsResult.error || notesResult.error);
    scheduleList.innerHTML = '<p class="error-text">일정을 불러오지 못했어요. 관리자 로그인 상태와 서버 연결을 확인해주세요.</p>';
    return;
  }

  const events = eventsResult.data || [];
  const notes = notesResult.data || [];
  const todayKey = formatDateKey(new Date());

  const dates = [...new Set([
    todayKey,
    ...events.map(item => item.start_date),
    ...notes.map(item => item.note_date)
  ])].sort();

  if (!dates.length) {
    scheduleList.innerHTML = '<p class="empty-text">등록된 일정이 없어요.</p>';
    return;
  }

  dates.forEach(date => {
    const group = document.createElement("section");
    group.className = "schedule-date-group";
    group.dataset.scheduleDate = date;
    if (date === todayKey) group.classList.add("schedule-today");

    const heading = document.createElement("div");
    heading.className = "schedule-date-heading";

    const title = document.createElement("strong");
    title.textContent = formatScheduleDateHeading(date) + (date === todayKey ? " · 오늘" : "");

    const count = document.createElement("span");
    const eventCount = events.filter(item => item.start_date === date).length;
    count.textContent = `${eventCount}개 일정`;

    heading.append(title, count);

    const body = document.createElement("div");
    body.className = "schedule-group-body";

    group.append(heading, body);

    if (isOwner) {
      group.addEventListener("dragover", event => {
        if ([...event.dataTransfer.types].includes("application/x-schedule-event")) {
          event.preventDefault();
          group.classList.add("touch-drop-target");
        }
      });

      group.addEventListener("dragleave", event => {
        if (!group.contains(event.relatedTarget)) {
          group.classList.remove("touch-drop-target");
        }
      });

      group.addEventListener("drop", async event => {
        const movedEventId = event.dataTransfer.getData("application/x-schedule-event");
        if (!movedEventId) return;

        event.preventDefault();
        group.classList.remove("touch-drop-target");

        await moveEventToDate(movedEventId, date);
      });
    }

    scheduleList.appendChild(group);

    const mixed = [
      ...events
        .filter(item => item.start_date === date)
        .map(item => ({ ...item, kind: "event", sort_order: Number(item.sort_order) || 0 })),
      ...notes
        .filter(item => item.note_date === date)
        .map(item => ({ ...item, kind: "note", sort_order: Number(item.sort_order) || 0 }))
    ].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    mixed.forEach((item, index) => {
      body.appendChild(
        renderScheduleGap(date, mixed[index - 1] || null, item, group)
      );

      if (item.kind === "event") {
        body.appendChild(renderScheduleEvent(item, todayKey, group));
      } else {
        body.appendChild(renderScheduleNote(item, group));
      }
    });

    body.appendChild(
      renderScheduleGap(date, mixed[mixed.length - 1] || null, null, group)
    );
  });
  if (scrollToToday) {
    requestAnimationFrame(() => {
      if (schedulePage.classList.contains("hidden")) return;
      const target = scheduleList.querySelector(`[data-schedule-date="${todayKey}"]`);
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
}

/* SEARCH */
searchButton.addEventListener("click", () => {
  searchModal.classList.remove("hidden");
  searchInput.value = "";
  searchResults.innerHTML = '<p class="empty-text">검색어를 입력해주세요.</p>';
  setTimeout(() => searchInput.focus(), 50);
});

searchCloseButton.addEventListener("click", () => searchModal.classList.add("hidden"));

searchModal.addEventListener("click", (event) => {
  if (event.target === searchModal) searchModal.classList.add("hidden");
});

let searchDebounce = null;

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(runSearch, 180);
});

async function runSearch() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    searchResults.innerHTML = '<p class="empty-text">검색어를 입력해주세요.</p>';
    return;
  }

  searchResults.innerHTML = '<p class="empty-text">검색 중...</p>';

  const [t, qt, e, m] = await Promise.all([
    dbClient.from("todos").select("*"),
    dbClient.from("quick_todos").select("*"),
    dbClient.from("events").select("*"),
    dbClient.from("moods").select("*")
  ]);

  const results = [];

  (t.data || []).forEach(x => {
    if (x.title.toLowerCase().includes(q)) results.push({ type:"할 일", date:x.target_date || "", title:x.title, body:x.is_completed ? "완료" : "미완료" });
  });

  (qt.data || []).forEach(x => {
    if (x.title.toLowerCase().includes(q)) results.push({ type:"QUICK TODO", date:x.completed_at ? x.completed_at.slice(0,10) : "", title:x.title, body:x.is_completed ? "완료" : "진행 중" });
  });

  (e.data || []).forEach(x => {
    const text = `${x.title} ${x.description || ""}`.toLowerCase();
    if (text.includes(q)) results.push({ type:"일정", date:x.start_date === x.end_date ? x.start_date : `${x.start_date} ~ ${x.end_date}`, title:x.title, body:x.description || "" });
  });

  (m.data || []).forEach(x => {
    if ((x.reason || "").toLowerCase().includes(q)) {
      const label = MOODS.find(m => m.value === x.mood_type)?.label || x.mood_type;
      results.push({ type:"기분", date:x.record_date, title:label, body:x.reason || "" });
    }
  });

  renderSearchResults(results);
}

function renderSearchResults(items) {
  searchResults.innerHTML = "";

  if (!items.length) {
    searchResults.innerHTML = '<p class="empty-text">검색 결과가 없어요.</p>';
    return;
  }

  items.slice(0, 100).forEach(item => {
    const row = document.createElement("div");
    row.className = "search-result";

    const head = document.createElement("strong");
    head.textContent = item.type + (item.date ? ` · ${item.date}` : "");

    const title = document.createElement("p");
    title.textContent = item.title;

    row.append(head, title);

    if (item.body) {
      const body = document.createElement("span");
      body.textContent = item.body;
      row.appendChild(body);
    }

    searchResults.appendChild(row);
  });
}

window.addEventListener("pageshow", () => {
  if (!siteApp.classList.contains("hidden") && !calendarPage.classList.contains("hidden")) {
    requestAnimationFrame(() => renderCalendar());
  }
});

let calendarResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(calendarResizeTimer);
  calendarResizeTimer = setTimeout(() => {
    if (!calendarPage.classList.contains("hidden")) renderCalendar();
  }, 120);
});

let lastQuickTodoDateKey = formatDateKey(new Date());

function refreshQuickTodoOnDateChange() {
  const todayKey = formatDateKey(new Date());

  if (todayKey === lastQuickTodoDateKey) return;

  lastQuickTodoDateKey = todayKey;

  // 날짜가 넘어가면 메인 완료 목록은 새 날짜 기준으로 즉시 다시 그린다.
  if (!siteApp.classList.contains("hidden")) {
    if (isOwner) loadQuickTodos();

    // 열려 있는 사이드탭은 기록 날짜 자체가 고정되어 있으므로 해당 날짜 기록을 유지한다.
    if (selectedRecordDate && dayPanel.classList.contains("open")) {
      loadDayTodos(selectedRecordDate);
    }
  }
}

window.setInterval(refreshQuickTodoOnDateChange, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshQuickTodoOnDateChange();
});

/* START */
clearQuickTodoAutofill();
checkSession();

window.addEventListener('calendar-api-error', e => { document.getElementById('connectionMessage').textContent = e.detail; });
