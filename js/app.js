// ==============================
// TASKFLOW — ОСНОВНА ЛОГІКА
// Dashboard, завдання та LocalStorage
// ==============================

// Ключ, під яким завдання зберігаються у LocalStorage.
const TASKS_KEY = "taskflow-tasks";
const THEME_KEY = "taskflow-theme";
const USER_KEY = "taskflow-user";
const POMODORO_KEY = "taskflow-pomodoro-data";
const POMODORO_TIMER_KEY = "taskflow-pomodoro-timer";
const PROFILE_KEY = "taskflow-profile";
const POMODORO_SETTINGS_KEY = "taskflow-pomodoro-settings";
const CATEGORIES_KEY = "taskflow-categories";
const NOTIFICATIONS_KEY = "taskflow-notifications";

// Запам'ятовуємо статичний текст сторінки до першого рендеру (див. i18n.js).
registerStaticI18n();

// Додаткові налаштування, кошик і нотатки оголошуємо на початку, щоб вони були
// доступні будь-якій функції (раніше вони створювалися в кінці файлу).
const SETTINGS_KEY = "taskflow-extra-settings";
const TRASH_KEY = "taskflow-trash";
const NOTES_KEY = "taskflow-quick-notes";
function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}
const extraSettings = readJson(SETTINGS_KEY, {});
extraSettings.language = getLanguage();
let taskTrash = readJson(TRASH_KEY, []);
let quickNotes = readJson(NOTES_KEY, []);
let currentPage = "dashboard";

// Знаходимо потрібні HTML-елементи.
const elements = {
  total: document.querySelector("#total-tasks"),
  completed: document.querySelector("#completed-tasks"),
  active: document.querySelector("#active-tasks"),
  overdue: document.querySelector("#overdue-tasks"),
  progressRing: document.querySelector("#progress-ring"),
  progressPercent: document.querySelector("#progress-percent"),
  legendCompleted: document.querySelector("#legend-completed"),
  legendRemaining: document.querySelector("#legend-remaining"),
  todayList: document.querySelector("#today-task-list"),
  todayCount: document.querySelector("#today-count"),
  emptyState: document.querySelector("#empty-state"),
  modal: document.querySelector("#task-modal"),
  form: document.querySelector("#task-form"),
  modalTitle: document.querySelector("#modal-title"),
  taskId: document.querySelector("#task-id"),
  taskTitle: document.querySelector("#task-title"),
  taskDescription: document.querySelector("#task-description"),
  taskDate: document.querySelector("#task-date"),
  taskTime: document.querySelector("#task-time"),
  taskCategory: document.querySelector("#task-category"),
  taskPriority: document.querySelector("#task-priority"),
  toast: document.querySelector("#toast"),
  allTaskList: document.querySelector("#all-task-list"),
  allTasksCount: document.querySelector("#all-tasks-count"),
  allTasksSubtitle: document.querySelector("#all-tasks-subtitle"),
  tasksEmpty: document.querySelector("#tasks-empty"),
  tasksSearch: document.querySelector("#tasks-search"),
  tasksStatusFilter: document.querySelector("#tasks-status-filter"),
  tasksCategoryFilter: document.querySelector("#tasks-category-filter"),
  tasksPage: document.querySelector("#tasks-page"),
  dashboardPage: document.querySelector("#dashboard-page"),
  calendarPage: document.querySelector("#calendar-page"),
  kanbanPage: document.querySelector("#kanban-page"),
  statisticsPage: document.querySelector("#statistics-page"),
  pomodoroPage: document.querySelector("#pomodoro-page"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarMonthTitle: document.querySelector("#calendar-month-title"),
  calendarDayList: document.querySelector("#calendar-day-list"),
  calendarDayCount: document.querySelector("#calendar-day-count"),
  calendarDayEmpty: document.querySelector("#calendar-day-empty")
};


// Показуємо власне модальне вікно підтвердження замість confirm() браузера.
function showConfirm(message, title = t("Підтвердження дії"), acceptText = t("Підтвердити")) {
  const backdrop = document.querySelector("#confirm-modal");
  const titleElement = document.querySelector("#confirm-title");
  const messageElement = document.querySelector("#confirm-message");
  const acceptButton = document.querySelector("#confirm-accept");
  const cancelButton = document.querySelector("#confirm-cancel");

  titleElement.textContent = title;
  messageElement.textContent = message;
  acceptButton.textContent = acceptText;
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  acceptButton.focus();

  return new Promise(resolve => {
    const finish = result => {
      backdrop.classList.remove("open");
      backdrop.setAttribute("aria-hidden", "true");
      acceptButton.removeEventListener("click", onAccept);
      cancelButton.removeEventListener("click", onCancel);
      backdrop.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };
    const onAccept = () => finish(true);
    const onCancel = () => finish(false);
    const onBackdrop = event => { if (event.target === backdrop) finish(false); };
    const onKeydown = event => { if (event.key === "Escape") finish(false); };

    acceptButton.addEventListener("click", onAccept);
    cancelButton.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKeydown);
  });
}

// Отримуємо сьогоднішню дату у форматі YYYY-MM-DD.
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Створюємо початкові демонстраційні завдання, якщо список порожній.
function createDemoTasks() {
  const today = getToday();
  return [
    {
      id: crypto.randomUUID(),
      title: "Підготувати матеріали до навчання",
      description: "Переглянути конспект та повторити основні теми",
      demo: true,
      date: today,
      time: "10:00",
      category: "Навчання",
      priority: "high",
      status: "planned",
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Попрацювати над власним проєктом",
      description: "Продовжити розробку інтерфейсу TaskFlow",
      demo: true,
      date: today,
      time: "14:30",
      category: "Особисте",
      priority: "medium",
      status: "in-progress",
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Скласти план на наступний тиждень",
      demo: true,
      description: "",
      date: today,
      time: "",
      category: "Особисте",
      priority: "low",
      status: "planned",
      createdAt: new Date().toISOString()
    }
  ];
}

const TASK_STATUSES = ["planned", "in-progress", "review", "completed"];

// Приводимо завдання до єдиного формату (старі записи мали підзавдання як рядки).
function normalizeTask(task) {
  return {
    ...task,
    status: TASK_STATUSES.includes(task.status) ? task.status : "planned",
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks
        .map(item => typeof item === "string"
          ? { text: item, done: false }
          : { text: String(item?.text ?? ""), done: Boolean(item?.done) })
        .filter(item => item.text.trim())
      : []
  };
}

// Завантажуємо завдання з LocalStorage.
// Якщо даних ще немає, додаємо демонстраційні завдання.
function loadTasks() {
  const savedTasks = localStorage.getItem(TASKS_KEY);

  if (savedTasks !== null) {
    try {
      const parsedTasks = JSON.parse(savedTasks);
      // Перевіряємо старі записи, щоб новий статус працював із попередніми даними.
      return parsedTasks.map(normalizeTask);
    } catch (error) {
      console.error("Не вдалося прочитати завдання:", error);
      return [];
    }
  }

  const demoTasks = createDemoTasks();
  localStorage.setItem(TASKS_KEY, JSON.stringify(demoTasks));
  return demoTasks;
}

let tasks = loadTasks();

// Завантажуємо історію сповіщень із LocalStorage.
function loadNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Не вдалося завантажити сповіщення:", error);
    return [];
  }
}

let notifications = loadNotifications();

// Стандартні категорії для нового простору TaskFlow.
const defaultCategories = [
  { id: "study", name: "Навчання", color: "#8a82ff" },
  { id: "work", name: "Робота", color: "#4895ed" },
  { id: "personal", name: "Особисте", color: "#20b879" },
  { id: "shopping", name: "Покупки", color: "#eea33b" },
  { id: "other", name: "Інше", color: "#a2a5b5" }
];

// Завантажуємо власні категорії або створюємо стандартний набір.
function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
    if (Array.isArray(saved) && saved.length) {
      const merged = [...saved];
      // Не втрачаємо стандартну категорію «Інше», потрібну для перенесення завдань.
      if (!merged.some(category => category.name === "Інше")) merged.push(defaultCategories[4]);
      return merged;
    }
  } catch (error) {
    console.error("Не вдалося завантажити категорії:", error);
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  return [...defaultCategories];
}

let categories = loadCategories();

function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  scheduleTaskFlowCloudSave();
}

function getCategoryColor(name) {
  return categories.find(category => category.name === name)?.color || "#a2a5b5";
}

// Оновлюємо списки категорій у формі завдання та фільтрі.
function refreshCategorySelects() {
  const currentTaskCategory = elements.taskCategory.value;
  const currentFilter = elements.tasksCategoryFilter.value || "all";
  elements.taskCategory.innerHTML = "";
  elements.tasksCategoryFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("Усі категорії");
  elements.tasksCategoryFilter.append(allOption);

  categories.forEach(category => {
    const taskOption = document.createElement("option");
    taskOption.value = category.name;
    taskOption.textContent = categoryLabel(category.name);
    elements.taskCategory.append(taskOption);

    const filterOption = document.createElement("option");
    filterOption.value = category.name;
    filterOption.textContent = categoryLabel(category.name);
    elements.tasksCategoryFilter.append(filterOption);
  });

  elements.taskCategory.value = categories.some(category => category.name === currentTaskCategory)
    ? currentTaskCategory : (categories[0]?.name || "Інше");
  elements.tasksCategoryFilter.value = categories.some(category => category.name === currentFilter) ? currentFilter : "all";
}

// Зберігаємо поточний список завдань.
function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  scheduleTaskFlowCloudSave();
}

// Повертає назву пріоритету для інтерфейсу.
function getPriorityInfo(priority) {
  const priorities = {
    high: { label: t("Високий"), className: "priority-high" },
    medium: { label: t("Середній"), className: "priority-medium" },
    low: { label: t("Низький"), className: "priority-low" }
  };

  return priorities[priority] || priorities.medium;
}

// Перевіряємо, чи завдання прострочене.
// Завершені завдання не вважаємо простроченими.
function isOverdue(task) {
  return task.date < getToday() && task.status !== "completed";
}

// Форматуємо дату для показу у списку.
function formatTaskDate(dateString) {
  if (dateString === getToday()) return t("Сьогодні");

  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat(getLocale(), {
    day: "numeric",
    month: "short"
  }).format(date);
}

// Оновлюємо статистичні картки та круговий індикатор.
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === "completed").length;
  const active = tasks.filter(task => task.status !== "completed").length;
  const overdue = tasks.filter(isOverdue).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const remaining = total - completed;

  elements.total.textContent = total;
  elements.completed.textContent = completed;
  elements.active.textContent = active;
  elements.overdue.textContent = overdue;

  elements.progressPercent.textContent = `${percent}%`;
  elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
  elements.legendCompleted.textContent = completed;
  elements.legendRemaining.textContent = remaining;

  document.querySelector("#nav-task-count").textContent = active;
}

// Демонстраційні завдання зберігаються українською, але показуються мовою інтерфейсу.
// Після редагування користувачем вони стають звичайними завданнями (demo: false).
function taskTitle(task) { return task.demo ? t(task.title) : task.title; }
function taskDescription(task) { return task.demo && task.description ? t(task.description) : (task.description || ""); }

// Підпис статусу завдання поточною мовою.
function statusLabel(status) {
  const labels = {
    planned: "Заплановано",
    "in-progress": "У процесі",
    review: "На перевірці",
    completed: "Виконано"
  };
  return t(labels[status] || labels.planned);
}

// Створюємо HTML одного рядка завдання.
function createTaskElement(task, { showDate = true } = {}) {
  const priority = getPriorityInfo(task.priority);
  const completed = task.status === "completed";
  const row = document.createElement("article");

  row.className = `task-row${completed ? " is-completed" : ""}`;
  row.dataset.taskId = task.id;

  // Для текстових значень використовуємо textContent, щоб не вставляти HTML користувача.
  const checkButton = document.createElement("button");
  checkButton.className = `task-check${completed ? " checked" : ""}`;
  checkButton.type = "button";
  checkButton.setAttribute("aria-label", completed ? t("Позначити невиконаним") : t("Позначити виконаним"));
  checkButton.innerHTML = completed ? '<i data-lucide="check"></i>' : "";
  checkButton.addEventListener("click", () => toggleTask(task.id));

  const main = document.createElement("div");
  main.className = "task-main";

  const name = document.createElement("span");
  name.className = "task-name";
  name.textContent = taskTitle(task);
  main.appendChild(name);

  if (task.description) {
    const description = document.createElement("span");
    description.className = "task-description";
    description.textContent = taskDescription(task);
    main.appendChild(description);
  }
  if (task.subtasks?.length) {
    const doneCount = task.subtasks.filter(item => item.done).length;
    const subtaskInfo = document.createElement("span");
    subtaskInfo.className = "task-description subtask-count";
    subtaskInfo.textContent = t("Підзавдання: {done}/{total}", { done: doneCount, total: task.subtasks.length });
    main.appendChild(subtaskInfo);

    // Підзавдання можна відмічати прямо у списку.
    const subtaskList = document.createElement("ul");
    subtaskList.className = "subtask-list";
    task.subtasks.forEach(subtask => {
      const item = document.createElement("li");
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = subtask.done;
      box.addEventListener("change", () => {
        // Оновлюємо лише лічильник і копії цього завдання, без повного перемальовування —
        // інакше список перебудовувався під курсором, і клік міг «губитися».
        subtask.done = box.checked;
        saveTasks();
        const done = task.subtasks.filter(item => item.done).length;
        document.querySelectorAll(`.task-row[data-task-id="${task.id}"]`).forEach(rowElement => {
          const info = rowElement.querySelector(".subtask-count");
          if (info) info.textContent = t("Підзавдання: {done}/{total}", { done, total: task.subtasks.length });
          rowElement.querySelectorAll(".subtask-list input").forEach((input, index) => {
            input.checked = Boolean(task.subtasks[index]?.done);
          });
        });
      });
      const text = document.createElement("span");
      text.textContent = subtask.text;
      label.append(box, text);
      item.append(label);
      subtaskList.append(item);
    });
    main.appendChild(subtaskList);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const category = document.createElement("span");
  category.className = "category-pill";
  category.textContent = categoryLabel(task.category);
  category.style.setProperty("--category-color", getCategoryColor(task.category));

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `priority-pill ${priority.className}`;
  priorityBadge.textContent = priority.label;

  meta.append(category, priorityBadge);

  const deadline = document.createElement("span");
  deadline.className = `task-deadline${isOverdue(task) ? " overdue" : ""}`;
  deadline.textContent = showDate
    ? (task.time ? `${formatTaskDate(task.date)} · ${task.time}` : formatTaskDate(task.date))
    : (task.time || formatTaskDate(task.date));

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.className = "task-action";
  editButton.type = "button";
  editButton.title = t("Редагувати");
  editButton.setAttribute("aria-label", t("Редагувати завдання"));
  editButton.innerHTML = '<i data-lucide="pencil"></i>';
  editButton.addEventListener("click", () => openEditModal(task.id));

  const deleteButton = document.createElement("button");
  deleteButton.className = "task-action delete";
  deleteButton.type = "button";
  deleteButton.title = t("Видалити");
  deleteButton.setAttribute("aria-label", t("Видалити завдання"));
  deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  const favoriteButton = document.createElement("button");
  favoriteButton.className = `task-action favorite${task.favorite ? " is-favorite" : ""}`;
  favoriteButton.type = "button";
  favoriteButton.title = task.favorite ? t("Прибрати з обраного") : t("Додати в обране");
  favoriteButton.setAttribute("aria-label", favoriteButton.title);
  favoriteButton.setAttribute("aria-pressed", String(Boolean(task.favorite)));
  favoriteButton.innerHTML = '<i data-lucide="star"></i>';
  favoriteButton.addEventListener("click", () => {
    task.favorite = !task.favorite; saveTasks(); renderDashboard(); renderAllTasks();
  });
  actions.append(favoriteButton, editButton, deleteButton);
  row.append(checkButton, main, meta, deadline, actions);

  return row;
}

// Малюємо завдання, дедлайн яких припадає на сьогодні.
function renderTodayTasks() {
  const todayTasks = tasks
    .filter(task => task.date === getToday())
    .sort((a, b) => {
      // Спочатку показуємо невиконані завдання, потім сортуємо за часом.
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return (a.time || "99:99").localeCompare(b.time || "99:99");
    });

  elements.todayList.innerHTML = "";
  elements.todayCount.textContent = todayTasks.length;
  elements.emptyState.classList.toggle("visible", todayTasks.length === 0);

  todayTasks.forEach(task => {
    elements.todayList.appendChild(createTaskElement(task, { showDate: false }));
  });

  // Після додавання нових іконок оновлюємо Lucide.
  refreshIcons();
}


// Показуємо всі завдання на сторінці «Мої завдання».
function renderAllTasks() {
  if (!elements.allTaskList) return;

  const searchText = elements.tasksSearch.value.trim().toLowerCase();
  const statusValue = elements.tasksStatusFilter.value;
  const categoryValue = elements.tasksCategoryFilter.value;

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = taskTitle(task).toLowerCase().includes(searchText)
        || taskDescription(task).toLowerCase().includes(searchText);
      const matchesStatus = statusValue === "all"
        || (statusValue === "favorite" ? Boolean(task.favorite) : task.status === statusValue);
      const matchesCategory = categoryValue === "all" || task.category === categoryValue;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99");
    });

  elements.allTaskList.innerHTML = "";
  elements.allTasksCount.textContent = filteredTasks.length;
  elements.allTasksSubtitle.textContent = t("Показано: {shown} із {total}", { shown: filteredTasks.length, total: tasks.length });
  elements.tasksEmpty.classList.toggle("visible", filteredTasks.length === 0);

  filteredTasks.forEach(task => {
    elements.allTaskList.appendChild(createTaskElement(task));
  });

  refreshIcons();
}


// Поточний місяць і вибрана дата календаря.
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = getToday();
let calendarView = "month";

// Перетворюємо дату на YYYY-MM-DD без проблем із часовими поясами.
function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Малюємо календар у режимі місяця, тижня або дня.
function renderCalendar() {
  if (!elements.calendarGrid) return;

  const title = document.querySelector("#calendar-month-title");
  const weekdays = document.querySelector(".calendar-weekdays");
  const selectedDate = new Date(`${selectedCalendarDate}T00:00:00`);
  const monthName = new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(calendarMonth);

  elements.calendarGrid.innerHTML = "";
  elements.calendarGrid.classList.toggle("calendar-grid-day", calendarView === "day");
  elements.calendarGrid.classList.toggle("calendar-grid-week", calendarView === "week");
  weekdays.hidden = calendarView === "day";

  let gridStart;
  let dayCount;

  if (calendarView === "month") {
    title.textContent = monthName;
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);
    dayCount = 42;
  } else if (calendarView === "week") {
    const mondayOffset = (selectedDate.getDay() + 6) % 7;
    gridStart = new Date(selectedDate);
    gridStart.setDate(selectedDate.getDate() - mondayOffset);
    const weekEnd = new Date(gridStart);
    weekEnd.setDate(gridStart.getDate() + 6);
    title.textContent = `${gridStart.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })} — ${weekEnd.toLocaleDateString(getLocale(), { day: "numeric", month: "short", year: "numeric" })}`;
    dayCount = 7;
  } else {
    gridStart = new Date(selectedDate);
    title.textContent = selectedDate.toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    dayCount = 1;
  }

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const dateKey = dateToKey(date);
    const dayTasks = tasks.filter(task => task.date === dateKey);

    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    if (calendarView === "month" && date.getMonth() !== calendarMonth.getMonth()) dayButton.classList.add("outside-month");
    if (dateKey === getToday()) dayButton.classList.add("today");
    if (dateKey === selectedCalendarDate) dayButton.classList.add("selected");

    let number;
    if (calendarView === "day") {
      // У режимі дня показуємо число окремо, а назву дня та місяць — збоку.
      const dateLayout = document.createElement("span");
      dateLayout.className = "calendar-day-date-layout";

      const dateNumber = document.createElement("span");
      dateNumber.className = "calendar-day-date-number";
      dateNumber.textContent = date.getDate();

      const dateDetails = document.createElement("span");
      dateDetails.className = "calendar-day-date-details";

      const weekday = document.createElement("strong");
      weekday.textContent = date.toLocaleDateString(getLocale(), { weekday: "long" });

      const month = document.createElement("small");
      month.textContent = date.toLocaleDateString(getLocale(), { month: "long" });

      dateDetails.append(weekday, month);
      dateLayout.append(dateNumber, dateDetails);
      number = dateLayout;
    } else {
      number = document.createElement("span");
      number.className = "calendar-day-number";
      // У тижневому режимі число і скорочену назву дня показуємо окремо,
      // щоб вони не стискалися всередині маленької круглої позначки.
      number.textContent = date.getDate();
    }

    let weekdayLabel = null;
    if (calendarView === "week") {
      weekdayLabel = document.createElement("span");
      weekdayLabel.className = "calendar-day-weekday";
      weekdayLabel.textContent = date.toLocaleDateString(getLocale(), { weekday: "short" });
    }

    const markers = document.createElement("span");
    markers.className = "calendar-day-markers";
    dayTasks.slice(0, 8).forEach(task => {
      const marker = document.createElement("i");
      if (task.status === "completed") marker.classList.add("done");
      else if (task.status === "review") marker.classList.add("review");
      markers.appendChild(marker);
    });

    dayButton.append(number);
    if (weekdayLabel) dayButton.append(weekdayLabel);
    dayButton.append(markers);
    if (dayTasks.length > 0) {
      const count = document.createElement("span");
      count.className = "calendar-day-count";
      count.textContent = `${dayTasks.length} ${plural(dayTasks.length, "taskShort")}`;
      dayButton.appendChild(count);
    }

    dayButton.addEventListener("click", () => {
      selectedCalendarDate = dateKey;
      calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendar();
    });
    elements.calendarGrid.appendChild(dayButton);
  }

  document.querySelectorAll("[data-calendar-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.calendarView === calendarView);
  });
  renderCalendarDay();
}

// Показуємо список завдань для вибраної дати.
function renderCalendarDay() {
  const dayTasks = tasks
    .filter(task => task.date === selectedCalendarDate)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const selectedDate = new Date(`${selectedCalendarDate}T00:00:00`);
  elements.calendarDayCount.textContent = dayTasks.length;
  elements.calendarDayEmpty.hidden = dayTasks.length > 0;
  elements.calendarDayList.innerHTML = "";

  document.querySelector("#calendar-selected-title").textContent =
    selectedDate.toLocaleDateString(getLocale(), { day: "numeric", month: "long" });
  document.querySelector("#calendar-selected-subtitle").textContent =
    selectedCalendarDate === getToday()
      ? t("Сьогодні")
      : selectedDate.toLocaleDateString(getLocale(), { weekday: "long" });

  dayTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "calendar-task";

    const time = document.createElement("span");
    time.className = "calendar-task-time";
    time.textContent = task.time || "—";

    const info = document.createElement("div");
    info.className = "calendar-task-info";

    const title = document.createElement("strong");
    title.textContent = taskTitle(task);
    if (task.status === "completed") title.style.textDecoration = "line-through";

    const details = document.createElement("small");
    details.textContent = `${categoryLabel(task.category)} · ${statusLabel(task.status)}`;
    info.append(title, details);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "calendar-task-edit";
    edit.setAttribute("aria-label", t("Редагувати завдання"));
    edit.innerHTML = '<i data-lucide="pencil"></i>';
    edit.addEventListener("click", () => openEditModal(task.id));

    item.append(time, info, edit);
    elements.calendarDayList.appendChild(item);
  });

  refreshIcons();
}

// Створюємо картку для Kanban-дошки.
function createKanbanCard(task) {
  const card = document.createElement("article");
  card.className = "kanban-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  const title = document.createElement("h3");
  title.className = "kanban-card-title";
  title.textContent = taskTitle(task);
  card.appendChild(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "kanban-card-description";
    description.textContent = taskDescription(task);
    card.appendChild(description);
  }

  const footer = document.createElement("div");
  footer.className = "kanban-card-footer";

  const details = document.createElement("span");
  details.textContent = `${categoryLabel(task.category)} · ${formatTaskDate(task.date)}`;

  const edit = document.createElement("button");
  edit.type = "button";
  edit.setAttribute("aria-label", t("Редагувати завдання"));
  edit.innerHTML = '<i data-lucide="pencil"></i>';
  edit.addEventListener("click", () => openEditModal(task.id));

  footer.append(details, edit);
  card.appendChild(footer);

  card.addEventListener("dragstart", event => {
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  return card;
}

// Розподіляємо картки за статусами.
function renderKanban() {
  ["planned", "in-progress", "review", "completed"].forEach(status => {
    const column = document.querySelector(`#kanban-${status}`);
    const columnTasks = tasks.filter(task => task.status === status);

    column.innerHTML = "";
    document.querySelector(`#kanban-count-${status}`).textContent = columnTasks.length;

    if (columnTasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "kanban-empty";
      empty.textContent = t("Перетягни сюди завдання");
      column.appendChild(empty);
    }

    columnTasks.forEach(task => column.appendChild(createKanbanCard(task)));
  });

  refreshIcons();
}

// Дозволяємо перетягувати завдання між колонками.
document.querySelectorAll(".kanban-dropzone").forEach(zone => {
  zone.addEventListener("dragover", event => {
    event.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", event => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", event => {
    event.preventDefault();
    zone.classList.remove("drag-over");

    const taskId = event.dataTransfer.getData("text/plain");
    const task = tasks.find(item => item.id === taskId);
    const newStatus = zone.dataset.status;

    if (!task || task.status === newStatus) return;

    setTaskStatus(task, newStatus);
    saveTasks();
    renderDashboard();
    showToast(t("Статус завдання змінено."));
  });
});

// ==============================
// АНАЛІТИКА ТА POMODORO
// ==============================

function loadPomodoroSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(POMODORO_SETTINGS_KEY));
    return {
      focus: Math.min(90, Math.max(1, Number(saved?.focus) || 25)),
      short: Math.min(30, Math.max(1, Number(saved?.short) || 5)),
      long: Math.min(60, Math.max(1, Number(saved?.long) || 15))
    };
  } catch (error) {
    return { focus: 25, short: 5, long: 15 };
  }
}

let pomodoroSettings = loadPomodoroSettings();
const POMODORO_MODES = {
  focus: { seconds: pomodoroSettings.focus * 60 },
  short: { seconds: pomodoroSettings.short * 60 },
  long: { seconds: pomodoroSettings.long * 60 }
};
const POMODORO_LABELS = { focus: "Час зосередитися", short: "Коротка перерва", long: "Довга перерва" };

// Підказка під таймером зберігається як ключ, щоб перекладатися разом з інтерфейсом.
let pomodoroHintKey = "Після фокус-сесії почнеться коротка перерва.";
function setPomodoroHint(key) {
  pomodoroHintKey = key;
  document.querySelector("#pomodoro-hint").textContent = t(key);
}

function loadPomodoroData() {
  try {
    const saved = JSON.parse(localStorage.getItem(POMODORO_KEY));
    return saved && Array.isArray(saved.sessions)
      ? { sessions: saved.sessions, minuteLogs: Array.isArray(saved.minuteLogs) ? saved.minuteLogs : [] }
      : { sessions: [], minuteLogs: [] };
  } catch (error) {
    console.error("Не вдалося прочитати статистику Pomodoro:", error);
    return { sessions: [], minuteLogs: [] };
  }
}

let pomodoroData = loadPomodoroData();
function savePomodoroData() {
  localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoroData));
  scheduleTaskFlowCloudSave();
}

function loadPomodoroTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(POMODORO_TIMER_KEY));
    if (saved && POMODORO_MODES[saved.mode]) return saved;
  } catch (error) {
    console.error("Не вдалося відновити таймер:", error);
  }
  return { mode: "focus", remainingMs: POMODORO_MODES.focus.seconds * 1000, running: false, endAt: null, loggedFocusMinutes: 0 };
}

let pomodoroTimer = loadPomodoroTimer();
let pomodoroInterval = null;

function savePomodoroTimer() {
  localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify(pomodoroTimer));
}

function formatTimer(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTodayPomodoroSessions() {
  return pomodoroData.sessions.filter(session => session.date === getToday());
}

function renderPomodoroStats() {
  const todaySessions = getTodayPomodoroSessions();
  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.minutes, 0)
    + pomodoroData.minuteLogs.filter(log => log.date === getToday()).length;
  const totalMinutes = pomodoroData.sessions.reduce((sum, session) => sum + session.minutes, 0)
    + pomodoroData.minuteLogs.length;
  const totalFocusSessions = pomodoroData.sessions.length;

  document.querySelector("#pomodoro-sessions-today").textContent = todaySessions.length;
  document.querySelector("#pomodoro-focus-today").textContent = t("{n} хв", { n: todayMinutes });
  document.querySelector("#pomodoro-sessions-total").textContent = totalFocusSessions;
  document.querySelector("#analytics-focus-time").textContent = t("{n} хв", { n: totalMinutes });
  document.querySelector("#analytics-today-sessions").textContent = todaySessions.length;
}

function renderPomodoroTaskOptions() {
  const select = document.querySelector("#pomodoro-task");
  const selected = select.value;
  select.innerHTML = "";
  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = t("Без конкретного завдання");
  select.appendChild(noneOption);
  tasks.filter(task => task.status !== "completed").forEach(task => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = taskTitle(task);
    select.appendChild(option);
  });
  if ([...select.options].some(option => option.value === selected)) select.value = selected;
}

function renderPomodoroTimer() {
  const mode = POMODORO_MODES[pomodoroTimer.mode];
  const remaining = pomodoroTimer.running ? Math.max(0, pomodoroTimer.endAt - Date.now()) : pomodoroTimer.remainingMs;
  const duration = mode.seconds * 1000;
  const progress = Math.max(0, Math.min(1, remaining / duration));
  document.querySelector("#pomodoro-time").textContent = formatTimer(remaining);
  document.querySelector("#pomodoro-mode-label").textContent = t(POMODORO_LABELS[pomodoroTimer.mode]);
  document.querySelector("#pomodoro-hint").textContent = t(pomodoroHintKey);
  const startButton = document.querySelector("#pomodoro-start");
  startButton.innerHTML = pomodoroTimer.running ? '<i data-lucide="pause"></i> ' : '<i data-lucide="play"></i> ';
  startButton.append(t(pomodoroTimer.running ? "Пауза" : "Почати"));
  document.querySelector("#pomodoro-ring").style.setProperty("--timer-progress", `${progress * 360}deg`);
  document.querySelectorAll("[data-pomodoro-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.pomodoroMode === pomodoroTimer.mode);
  });
  refreshIcons();
}

function stopPomodoroInterval() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  pomodoroInterval = null;
}

function finishPomodoroMode() {
  const finishedMode = pomodoroTimer.mode;
  if (finishedMode === "focus") recordFocusMinutes(0);
  pomodoroTimer.running = false;
  pomodoroTimer.endAt = null;
  if (finishedMode === "focus") {
    const taskSelect = document.querySelector("#pomodoro-task");
    const task = tasks.find(item => item.id === taskSelect.value);
    pomodoroData.sessions.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: getToday(),
      minutes: 0, // Хвилини вже записані поступово під час роботи таймера.
      taskId: task ? task.id : null,
      taskTitle: task ? task.title : ""
    });
    savePomodoroData();
    const focusCount = getTodayPomodoroSessions().length;
    pomodoroTimer.mode = focusCount % 4 === 0 ? "long" : "short";
    setPomodoroHint(focusCount % 4 === 0
      ? "Чудова робота! Час на довшу перерву."
      : "Фокус-сесію завершено. Час трохи відпочити.");
    showToast(t("Pomodoro-сесію завершено!"));
    if (extraSettings.notificationSound) playNotificationSound();
  } else {
    pomodoroTimer.mode = "focus";
    setPomodoroHint("Перерва завершена. Можна починати наступну фокус-сесію.");
    if (extraSettings.notificationSound) playNotificationSound();
  }
  pomodoroTimer.remainingMs = POMODORO_MODES[pomodoroTimer.mode].seconds * 1000;
  savePomodoroTimer();
  stopPomodoroInterval();
  renderPomodoroTimer();
  renderPomodoroStats();
  renderAnalytics();
}

// Записуємо кожну повну хвилину, протягом якої активний режим фокусування.
function recordFocusMinutes(remainingMs) {
  if (pomodoroTimer.mode !== "focus") return;

  const durationMs = POMODORO_MODES.focus.seconds * 1000;
  const elapsedMs = Math.max(0, durationMs - remainingMs);
  const completedMinutes = Math.floor(elapsedMs / 60000);
  const alreadyLogged = Number(pomodoroTimer.loggedFocusMinutes) || 0;

  if (completedMinutes <= alreadyLogged) return;

  const taskSelect = document.querySelector("#pomodoro-task");
  const task = tasks.find(item => item.id === taskSelect.value);
  for (let minute = alreadyLogged; minute < completedMinutes; minute++) {
    pomodoroData.minuteLogs.push({
      id: `${Date.now()}-${minute}-${Math.random().toString(16).slice(2)}`,
      date: getToday(),
      taskId: task ? task.id : null,
      taskTitle: task ? task.title : ""
    });
  }

  pomodoroTimer.loggedFocusMinutes = completedMinutes;
  savePomodoroData();
  savePomodoroTimer();
  renderPomodoroStats();
  renderAnalytics();
}

function tickPomodoro() {
  if (!pomodoroTimer.running) return;
  const remaining = pomodoroTimer.endAt - Date.now();
  recordFocusMinutes(Math.max(0, remaining));
  if (remaining <= 0) {
    finishPomodoroMode();
    return;
  }
  pomodoroTimer.remainingMs = remaining;
  renderPomodoroTimer();
}

function startPomodoro() {
  if (pomodoroTimer.running) {
    pomodoroTimer.remainingMs = Math.max(0, pomodoroTimer.endAt - Date.now());
    recordFocusMinutes(pomodoroTimer.remainingMs);
    pomodoroTimer.running = false;
    pomodoroTimer.endAt = null;
    stopPomodoroInterval();
  } else {
    if (pomodoroTimer.remainingMs <= 0) pomodoroTimer.remainingMs = POMODORO_MODES[pomodoroTimer.mode].seconds * 1000;
    pomodoroTimer.running = true;
    if (pomodoroTimer.mode === "focus" && pomodoroTimer.remainingMs === POMODORO_MODES.focus.seconds * 1000) {
      pomodoroTimer.loggedFocusMinutes = 0;
    }
    pomodoroTimer.endAt = Date.now() + pomodoroTimer.remainingMs;
    stopPomodoroInterval();
    pomodoroInterval = setInterval(tickPomodoro, 250);
  }
  savePomodoroTimer();
  renderPomodoroTimer();
}

function resetPomodoro() {
  if (pomodoroTimer.running && pomodoroTimer.mode === "focus") {
    recordFocusMinutes(Math.max(0, pomodoroTimer.endAt - Date.now()));
  }
  stopPomodoroInterval();
  pomodoroTimer.running = false;
  pomodoroTimer.endAt = null;
  pomodoroTimer.remainingMs = POMODORO_MODES[pomodoroTimer.mode].seconds * 1000;
  pomodoroTimer.loggedFocusMinutes = 0;
  savePomodoroTimer();
  renderPomodoroTimer();
}

function setPomodoroMode(mode) {
  if (!POMODORO_MODES[mode]) return;
  if (pomodoroTimer.running && pomodoroTimer.mode === "focus") {
    recordFocusMinutes(Math.max(0, pomodoroTimer.endAt - Date.now()));
  }
  stopPomodoroInterval();
  pomodoroTimer.mode = mode;
  pomodoroTimer.running = false;
  pomodoroTimer.endAt = null;
  pomodoroTimer.remainingMs = POMODORO_MODES[mode].seconds * 1000;
  pomodoroTimer.loggedFocusMinutes = 0;
  savePomodoroTimer();
  renderPomodoroTimer();
}

function renderBarChart(containerId, rows, colorClass) {
  const container = document.querySelector(`#${containerId}`);
  container.innerHTML = "";
  const maxValue = Math.max(1, ...rows.map(row => row.value));
  rows.forEach(row => {
    const item = document.createElement("div");
    item.className = "chart-row";
    const label = document.createElement("div");
    label.className = "chart-row-label";
    label.textContent = row.label;
    const track = document.createElement("div");
    track.className = "chart-track";
    const bar = document.createElement("span");
    bar.className = `chart-bar ${colorClass}`;
    bar.style.width = `${row.value === 0 ? 0 : Math.max(3, row.value / maxValue * 100)}%`;
    track.appendChild(bar);
    const value = document.createElement("strong");
    value.textContent = row.value;
    item.append(label, track, value);
    container.appendChild(item);
  });
}

function renderAnalytics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === "completed").length;
  document.querySelector("#analytics-total").textContent = total;
  document.querySelector("#analytics-completed").textContent = completed;
  document.querySelector("#analytics-completion-rate").textContent = t("{pct}% від усіх завдань", { pct: total ? Math.round(completed / total * 100) : 0 });
  renderBarChart("status-chart", [
    { label: statusLabel("planned"), value: tasks.filter(task => task.status === "planned").length },
    { label: statusLabel("in-progress"), value: tasks.filter(task => task.status === "in-progress").length },
    { label: statusLabel("review"), value: tasks.filter(task => task.status === "review").length },
    { label: statusLabel("completed"), value: completed }
  ], "status-bar");

  const categories = [...new Set(tasks.map(task => task.category || "Інше"))];
  renderBarChart("category-chart", categories.map(category => ({
    label: categoryLabel(category),
    value: tasks.filter(task => (task.category || "Інше") === category).length
  })), "category-bar");

  const chart = document.querySelector("#focus-week-chart");
  chart.innerHTML = "";
  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const minutes = pomodoroData.sessions.filter(session => session.date === key).reduce((sum, session) => sum + session.minutes, 0)
      + pomodoroData.minuteLogs.filter(log => log.date === key).length;
    days.push({ label: date.toLocaleDateString(getLocale(), { weekday: "short" }), minutes });
  }
  const maxMinutes = Math.max(25, ...days.map(day => day.minutes));
  days.forEach(day => {
    const column = document.createElement("div");
    column.className = "week-chart-column";
    const value = document.createElement("strong");
    value.textContent = day.minutes ? `${day.minutes}` : "0";
    const track = document.createElement("div");
    track.className = "week-chart-track";
    const bar = document.createElement("span");
    bar.style.height = `${day.minutes ? Math.max(5, day.minutes / maxMinutes * 100) : 0}%`;
    track.appendChild(bar);
    const label = document.createElement("small");
    label.textContent = day.label;
    column.append(value, track, label);
    chart.appendChild(column);
  });
  renderPomodoroStats();
}

// Кнопки та режими Pomodoro.
document.querySelector("#pomodoro-start").addEventListener("click", startPomodoro);
document.querySelector("#pomodoro-reset").addEventListener("click", resetPomodoro);
document.querySelectorAll("[data-pomodoro-mode]").forEach(button => {
  button.addEventListener("click", () => setPomodoroMode(button.dataset.pomodoroMode));
});

// Якщо таймер був запущений до перезавантаження сторінки, відновлюємо його.
if (pomodoroTimer.running) {
  if (pomodoroTimer.endAt <= Date.now()) finishPomodoroMode();
  else {
    pomodoroInterval = setInterval(tickPomodoro, 250);
  }
}

// Малюємо список категорій та кількість пов'язаних завдань.
function renderCategories() {
  refreshCategorySelects();
  const list = document.querySelector("#category-management-list");
  const count = document.querySelector("#categories-count");
  list.innerHTML = "";
  count.textContent = `${categories.length} ${plural(categories.length, "category")}`;

  // Оновлюємо коротку статистику та картки окремої сторінки категорій.
  const categoryCounts = categories.map(category => ({
    ...category,
    amount: tasks.filter(task => task.category === category.name).length
  }));
  const totalCategoryTasks = categoryCounts.reduce((sum, category) => sum + category.amount, 0);
  const mostUsedCategory = [...categoryCounts].sort((a, b) => b.amount - a.amount)[0];
  document.querySelector("#category-total-count").textContent = categories.length;
  document.querySelector("#category-task-total").textContent = totalCategoryTasks;
  document.querySelector("#category-most-used").textContent = mostUsedCategory?.amount ? categoryLabel(mostUsedCategory.name) : "—";

  const cardsGrid = document.querySelector("#category-cards-grid");
  cardsGrid.innerHTML = "";
  categoryCounts.forEach(category => {
    const card = document.createElement("article");
    card.className = "category-overview-card";
    card.style.setProperty("--category-color", category.color);
    const top = document.createElement("div");
    top.className = "category-overview-card-top";
    const icon = document.createElement("span");
    icon.className = "category-overview-card-icon";
    icon.innerHTML = '<i data-lucide="folder"></i>';
    const amount = document.createElement("span");
    amount.className = "category-overview-card-count";
    amount.textContent = category.amount;
    top.append(icon, amount);
    const title = document.createElement("h3");
    title.textContent = categoryLabel(category.name);
    const caption = document.createElement("p");
    caption.textContent = `${category.amount} ${plural(category.amount, "task")}`;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "category-open-button";
    open.append(t("Переглянути") + " ");
    open.insertAdjacentHTML("beforeend", '<i data-lucide="arrow-up-right"></i>');
    open.addEventListener("click", () => {
      elements.tasksCategoryFilter.value = category.name;
      showPage("tasks");
      renderAllTasks();
    });
    card.append(top, title, caption, open);
    cardsGrid.append(card);
  });

  categories.forEach(category => {
    const row = document.createElement("div");
    row.className = "category-management-item";

    const info = document.createElement("div");
    info.className = "category-management-info";
    const swatch = document.createElement("span");
    swatch.className = "category-color-swatch";
    swatch.style.backgroundColor = category.color;
    const textWrap = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = categoryLabel(category.name);
    const taskCount = document.createElement("small");
    const amount = tasks.filter(task => task.category === category.name).length;
    taskCount.textContent = `${amount} ${plural(amount, "task")}`;
    textWrap.append(name, taskCount);
    info.append(swatch, textWrap);

    const actions = document.createElement("div");
    actions.className = "category-management-actions";
    const edit = document.createElement("button");
    edit.className = "icon-button category-edit-button";
    edit.type = "button";
    edit.title = t("Редагувати категорію");
    edit.setAttribute("aria-label", t("Редагувати {name}", { name: categoryLabel(category.name) }));
    edit.innerHTML = '<i data-lucide="pencil"></i>';
    edit.addEventListener("click", () => startCategoryEdit(category.id));
    if (category.name !== "Інше") actions.append(edit);

    if (category.name !== "Інше") {
      const remove = document.createElement("button");
      remove.className = "icon-button category-delete-button";
      remove.type = "button";
      remove.title = t("Видалити категорію");
      remove.setAttribute("aria-label", t("Видалити {name}", { name: categoryLabel(category.name) }));
      remove.innerHTML = '<i data-lucide="trash-2"></i>';
      remove.addEventListener("click", () => deleteCategory(category.id));
      actions.append(remove);
    }

    row.append(info, actions);
    list.append(row);
  });
  if (window.lucide) lucide.createIcons();
}

function resetCategoryForm() {
  const form = document.querySelector("#category-form");
  form.reset();
  document.querySelector("#category-id").value = "";
  document.querySelector("#category-color").value = "#8a82ff";
  document.querySelector("#category-form-title").textContent = t("Нова категорія");
  document.querySelector("#category-submit-label").textContent = t("Додати категорію");
  document.querySelector("#category-cancel-edit").hidden = true;
}

function startCategoryEdit(id) {
  const category = categories.find(item => item.id === id);
  if (!category) return;
  document.querySelector("#category-id").value = category.id;
  document.querySelector("#category-name").value = category.name;
  document.querySelector("#category-color").value = category.color;
  document.querySelector("#category-form-title").textContent = t("Редагувати категорію");
  document.querySelector("#category-submit-label").textContent = t("Зберегти зміни");
  document.querySelector("#category-cancel-edit").hidden = false;
  document.querySelector("#category-name").focus();
}

async function deleteCategory(id) {
  const category = categories.find(item => item.id === id);
  if (!category || category.name === "Інше") return;
  const approved = await showConfirm(
    t("Видалити категорію «{name}»? Її завдання буде перенесено в «Інше».", { name: categoryLabel(category.name) }),
    t("Видалити категорію?"), t("Так, видалити"));
  if (!approved) return;

  tasks = tasks.map(task => task.category === category.name ? { ...task, category: "Інше" } : task);
  categories = categories.filter(item => item.id !== id);
  saveTasks();
  saveCategories();
  resetCategoryForm();
  renderCategories();
  renderDashboard();
  showToast(t("Категорію видалено."));
}

// Створення нової категорії або збереження її змін.
document.querySelector("#category-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = document.querySelector("#category-id").value;
  const name = document.querySelector("#category-name").value.trim();
  const color = document.querySelector("#category-color").value;
  if (!name) return;
  if (categories.some(category => category.name.toLocaleLowerCase() === name.toLocaleLowerCase() && category.id !== id)) {
    showToast(t("Категорія з такою назвою вже існує."));
    return;
  }

  if (id) {
    const oldCategory = categories.find(category => category.id === id);
    if (!oldCategory) return;
    const oldName = oldCategory.name;
    categories = categories.map(category => category.id === id ? { ...category, name, color } : category);
    if (oldName !== name) {
      tasks = tasks.map(task => task.category === oldName ? { ...task, category: name } : task);
      saveTasks();
    }
    showToast(t("Категорію оновлено."));
  } else {
    categories.push({ id: crypto.randomUUID(), name, color });
    showToast(t("Категорію додано."));
  }

  saveCategories();
  resetCategoryForm();
  renderCategories();
  renderDashboard();
});

document.querySelector("#category-cancel-edit").addEventListener("click", resetCategoryForm);

const PAGE_TITLES = {
  dashboard: "Огляд",
  tasks: "Мої завдання",
  calendar: "Календар",
  kanban: "Kanban",
  statistics: "Статистика",
  pomodoro: "Pomodoro",
  categories: "Категорії",
  profile: "Мій профіль",
  settings: "Налаштування"
};

// Оновлюємо заголовок вкладки та «хлібні крихти» поточною мовою.
function updatePageTitle() {
  const title = t(PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard);
  document.querySelector("#breadcrumb-current").textContent = title;
  document.title = `TaskFlow — ${title}`;
}

// Перемикаємо вміст між сторінками робочого простору.
function showPage(pageName) {
  if (!PAGE_TITLES[pageName]) pageName = "dashboard";
  const pages = {
    dashboard: elements.dashboardPage,
    tasks: elements.tasksPage,
    calendar: elements.calendarPage,
    kanban: elements.kanbanPage,
    statistics: elements.statisticsPage,
    pomodoro: elements.pomodoroPage,
    categories: document.querySelector("#categories-page"),
    profile: document.querySelector("#profile-page"),
    settings: document.querySelector("#settings-page")
  };

  Object.entries(pages).forEach(([name, page]) => {
    page.hidden = name !== pageName;
  });

  document.querySelectorAll("[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });

  currentPage = pageName;
  updatePageTitle();
  // Запам'ятовуємо сторінку в адресі, щоб після оновлення відкривався той самий розділ.
  try { history.replaceState(null, "", `#${pageName}`); } catch (error) { /* file:// або обмеження браузера */ }

  if (pageName === "tasks") renderAllTasks();
  if (pageName === "calendar") renderCalendar();
  if (pageName === "kanban") renderKanban();
  if (pageName === "statistics") renderAnalytics();
  if (pageName === "pomodoro") {
    renderPomodoroTaskOptions();
    renderPomodoroTimer();
    renderPomodoroStats();
  }
  if (pageName === "categories") renderCategories();
  if (pageName === "profile") renderProfile();
  if (pageName === "settings") renderSettings();

  closeSidebar();
}

// Оновлюємо весь Dashboard після будь-якої зміни.
function renderDashboard() {
  if (typeof renderTaskFlowAchievements === "function") renderTaskFlowAchievements();
  updateStatistics();
  renderAnalytics();
  renderPomodoroTaskOptions();
  renderTodayTasks();
  renderAllTasks();
  renderCalendar();
  renderKanban();
}

// Створюємо наступний екземпляр повторюваного завдання.
function createNextRecurringTask(task) {
  if (!task.repeat || task.repeat === "none" || task.nextInstanceCreated) return;
  const nextDate = new Date(`${task.date}T00:00:00`);
  if (task.repeat === "daily") nextDate.setDate(nextDate.getDate() + 1);
  if (task.repeat === "weekly") nextDate.setDate(nextDate.getDate() + 7);
  if (task.repeat === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

  const nextTask = {
    ...task,
    id: crypto.randomUUID(),
    date: dateToKey(nextDate),
    status: "planned",
    createdAt: new Date().toISOString(),
    nextInstanceCreated: false,
    subtasks: (task.subtasks || []).map(item => ({ ...item, done: false }))
  };
  // Firestore не приймає undefined, тому поле просто прибираємо.
  delete nextTask.completedAt;
  tasks.push(nextTask);
  task.nextInstanceCreated = true;
}

// Єдине місце зміни статусу: працює і для чекбокса, і для перетягування в Kanban.
function setTaskStatus(task, status) {
  const wasCompleted = task.status === "completed";
  task.status = status;
  if (status === "completed") {
    task.completedAt = dateToKey(new Date());
    if (!wasCompleted) createNextRecurringTask(task);
  } else {
    delete task.completedAt;
  }
}

// Позначаємо завдання виконаним або повертаємо попередній статус.
function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  setTaskStatus(task, task.status === "completed" ? "planned" : "completed");
  saveTasks();
  renderDashboard();
  showToast(task.status === "completed" ? t("Завдання виконано!") : t("Завдання повернуто до плану."));
}

// Видаляємо завдання після підтвердження.
async function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  const approved = await showConfirm(t("Видалити завдання «{title}»?", { title: taskTitle(task) }), t("Видалити завдання?"), t("Так, видалити"));
  if (!approved) return;

  taskTrash.push({ ...task, deletedAt: new Date().toISOString() });
  localStorage.setItem(TRASH_KEY, JSON.stringify(taskTrash));
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  renderDashboard();
  renderTrashCount();
  showToast(t("Завдання переміщено в кошик."));
}

// Відкриваємо порожню форму для створення завдання.
// Необов'язковий параметр — дата, яку треба підставити (наприклад, вибраний день календаря).
function openCreateModal(presetDate) {
  refreshCategorySelects();
  elements.form.reset();
  elements.taskId.value = "";
  elements.taskDate.value = typeof presetDate === "string" && presetDate ? presetDate : getToday();
  elements.taskPriority.value = "medium";
  document.querySelector("#task-subtasks").value = "";
  document.querySelector("#task-repeat").value = "none";
  elements.modalTitle.textContent = t("Нове завдання");
  openModal();
  elements.taskTitle.focus();
}

// Заповнюємо форму даними завдання для редагування.
function openEditModal(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  elements.taskId.value = task.id;
  elements.taskTitle.value = taskTitle(task);
  elements.taskDescription.value = taskDescription(task);
  elements.taskDate.value = task.date;
  elements.taskTime.value = task.time || "";
  elements.taskCategory.value = task.category;
  elements.taskPriority.value = task.priority;
  document.querySelector("#task-subtasks").value = (task.subtasks || []).map(item => item.text).join("\n");
  document.querySelector("#task-repeat").value = task.repeat || "none";
  elements.modalTitle.textContent = t("Редагувати завдання");
  openModal();
}

// Показуємо модальне вікно.
function openModal() {
  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Закриваємо модальне вікно.
function closeModal() {
  elements.modal.classList.remove("open");
  elements.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Обробляємо надсилання форми створення або редагування.
elements.form.addEventListener("submit", event => {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();
  if (!title) {
    elements.taskTitle.focus();
    return;
  }

  const existingId = elements.taskId.value;
  const existingTask = tasks.find(task => task.id === existingId);

  // Зберігаємо стан підзавдань, якщо їхній текст не змінювали.
  const previousSubtasks = existingTask?.subtasks || [];
  const subtaskLines = (document.querySelector("#task-subtasks")?.value || "")
    .split("\n").map(line => line.trim()).filter(Boolean);

  const taskData = {
    // Зберігаємо всі службові поля (completedAt, nextInstanceCreated тощо) при редагуванні.
    ...(existingTask || {}),
    demo: false,
    id: existingId || crypto.randomUUID(),
    title,
    description: elements.taskDescription.value.trim(),
    date: elements.taskDate.value,
    time: elements.taskTime.value,
    category: elements.taskCategory.value,
    priority: elements.taskPriority.value,
    status: existingTask ? existingTask.status : "planned",
    createdAt: existingTask ? existingTask.createdAt : new Date().toISOString(),
    subtasks: subtaskLines.map(text => ({ text, done: previousSubtasks.some(item => item.text === text && item.done) })),
    repeat: document.querySelector("#task-repeat")?.value || "none",
    favorite: existingTask?.favorite || false
  };

  if (existingTask) {
    tasks = tasks.map(task => task.id === existingId ? taskData : task);
    showToast(t("Зміни збережено."));
  } else {
    tasks.push(taskData);
    showToast(t("Нове завдання створено."));
  }

  saveTasks();
  renderDashboard();
  closeModal();
});

// Показуємо коротке повідомлення внизу екрана.
let toastTimer;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

// Підключаємо всі кнопки, які відкривають модальне вікно.
document.querySelector("#new-task-button").addEventListener("click", openCreateModal);
document.querySelector("#empty-add-button").addEventListener("click", openCreateModal);
document.querySelector("#close-modal-button").addEventListener("click", closeModal);
document.querySelector("#cancel-modal-button").addEventListener("click", closeModal);

// Закриваємо модальне вікно кліком по затемненню або клавішею Escape.
elements.modal.addEventListener("click", event => {
  if (event.target === elements.modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeModal(); closeTrash(); }
});

// Перемикання світлої та темної теми з її збереженням.
function applyTheme(theme) {
  const resolvedTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.body.classList.toggle("dark-theme", resolvedTheme === "dark");
  const themeButton = document.querySelector("#theme-toggle");
  themeButton.innerHTML = resolvedTheme === "dark"
    ? '<i data-lucide="sun"></i>'
    : '<i data-lucide="moon"></i>';
  themeButton.setAttribute("aria-label", resolvedTheme === "dark" ? t("Увімкнути світлу тему") : t("Увімкнути темну тему"));
  localStorage.setItem(THEME_KEY, theme);
  refreshIcons();
}

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

document.querySelector("#theme-toggle").addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
  applyTheme(newTheme);
});

// Відображаємо поточну дату українською мовою.
function renderCurrentDate() {
  const date = new Date();

  // Дата у верхній панелі.
  document.querySelector("#header-date").textContent = new Intl.DateTimeFormat(getLocale(), {
    weekday: "short",
    day: "numeric",
    month: "long"
  }).format(date);

  // День тижня в заголовку Dashboard оновлюється автоматично.
  const weekday = new Intl.DateTimeFormat(getLocale(), { weekday: "long" }).format(date);
  document.querySelector("#welcome-eyebrow").textContent =
    `${weekday.toLocaleUpperCase(getLocale())} • ${t("ТВІЙ ПРОСТІР ПРОДУКТИВНОСТІ")}`;

  // Вітання залежить від часу доби.
  const hour = date.getHours();
  const greeting = hour >= 5 && hour < 12 ? "Доброго ранку,"
    : hour >= 12 && hour < 18 ? "Доброго дня,"
    : hour >= 18 && hour < 23 ? "Доброго вечора," : "Доброї ночі,";
  document.querySelector("#welcome-greeting").textContent = t(greeting);
}

// Профіль користувача зберігається локально до підключення авторизації.
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (saved && typeof saved === "object") return {
      name: saved.name || localStorage.getItem(USER_KEY) || "Олександр",
      about: saved.about || "",
      avatar: saved.avatar || "",
      guest: false
    };
  } catch (error) {
    console.error("Не вдалося прочитати профіль:", error);
  }
  return { name: localStorage.getItem(USER_KEY) || "Олександр", about: "", avatar: "", guest: false };
}

let userProfile = loadProfile();

function updateAvatarElement(element, name, avatar) {
  if (!element) return;
  element.textContent = avatar ? "" : (name.trim().charAt(0).toUpperCase() || "?");
  element.style.backgroundImage = avatar ? `url("${avatar}")` : "";
  element.classList.toggle("has-photo", Boolean(avatar));
}

function renderUserName() {
  const name = userProfile.guest ? t("Гість") : (userProfile.name || "Олександр");
  document.querySelector("#welcome-name").textContent = name;
  document.querySelector("#sidebar-user-name").textContent = name;
  updateAvatarElement(document.querySelector("#top-avatar"), name, userProfile.avatar);
  updateAvatarElement(document.querySelector(".profile-mini .avatar"), name, userProfile.avatar);
}

function renderProfile() {
  document.querySelector("#profile-name").value = userProfile.name;
  document.querySelector("#profile-about").value = userProfile.about;
  document.querySelector("#profile-preview-name").textContent = userProfile.name;
  document.querySelector("#profile-preview-about").textContent = userProfile.about || t("Особистий простір у TaskFlow");
  updateAvatarElement(document.querySelector("#profile-large-avatar"), userProfile.name, userProfile.avatar);
  renderUserName();
}

// Міст між основною логікою TaskFlow та Firebase Authentication.
// app.js залишається звичайним скриптом, щоб не змінювати область видимості його функцій.
window.applyFirebaseProfile = function (user) {
  if (user) {
    userProfile.guest = false;
    userProfile.name = user.displayName || user.email?.split("@")[0] || t("Користувач");
    userProfile.avatar = user.photoURL || userProfile.avatar || "";
    localStorage.setItem(USER_KEY, userProfile.name);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    renderProfile();
  } else {
    userProfile = { name: "", about: "", avatar: "", guest: true };
    renderUserName();
  }
};

function renderSettings() {
  document.querySelector("#settings-theme").value = localStorage.getItem(THEME_KEY) || "light";
  document.querySelector("#settings-language").value = getLanguage();
  document.querySelector("#setting-focus-minutes").value = pomodoroSettings.focus;
  document.querySelector("#setting-short-minutes").value = pomodoroSettings.short;
  document.querySelector("#setting-long-minutes").value = pomodoroSettings.long;
}

// Зберігаємо редагування профілю та оновлюємо ім'я в усьому інтерфейсі.
document.querySelector("#profile-form").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.querySelector("#profile-name").value.trim();
  if (!name) return showToast(t("Вкажи ім'я для профілю."));
  userProfile.guest = false;
  userProfile.name = name;
  userProfile.about = document.querySelector("#profile-about").value.trim();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  localStorage.setItem(USER_KEY, name);
  scheduleTaskFlowCloudSave();
  renderProfile();
  showToast(t("Профіль збережено."));
});

// Стискаємо фото до квадрата 256×256. Оригінал на 2 МБ у base64 перевищив би
// ліміт документа Firestore (1 МБ), і синхронізація б не спрацювала.
function resizeAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(image.width, image.height);
      canvas.getContext("2d").drawImage(
        image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    image.src = url;
  });
}

// Завантажуємо фото профілю, перевіряючи тип і розмір файлу.
document.querySelector("#profile-avatar-file").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
    showToast(t("Обери PNG, JPG або WEBP до 2 МБ."));
    event.target.value = "";
    return;
  }
  try {
    userProfile.avatar = await resizeAvatar(file);
  } catch (error) {
    showToast(t("Не вдалося обробити зображення."));
    event.target.value = "";
    return;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  scheduleTaskFlowCloudSave();
  renderProfile();
  showToast(t("Фото профілю оновлено."));
});

document.querySelector("#profile-remove-avatar").addEventListener("click", () => {
  userProfile.avatar = "";
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  scheduleTaskFlowCloudSave();
  renderProfile();
  document.querySelector("#profile-avatar-file").value = "";
  showToast(t("Фото профілю прибрано."));
});

// Зберігаємо персональну тривалість Pomodoro-інтервалів.
document.querySelector("#pomodoro-settings-form").addEventListener("submit", event => {
  event.preventDefault();
  const nextSettings = {
    focus: Number(document.querySelector("#setting-focus-minutes").value),
    short: Number(document.querySelector("#setting-short-minutes").value),
    long: Number(document.querySelector("#setting-long-minutes").value)
  };
  if (nextSettings.focus < 1 || nextSettings.focus > 90 || nextSettings.short < 1 || nextSettings.short > 30 || nextSettings.long < 1 || nextSettings.long > 60) {
    showToast(t("Перевір допустиму тривалість інтервалів."));
    return;
  }
  pomodoroSettings = nextSettings;
  localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(pomodoroSettings));
  scheduleTaskFlowCloudSave();
  POMODORO_MODES.focus.seconds = pomodoroSettings.focus * 60;
  POMODORO_MODES.short.seconds = pomodoroSettings.short * 60;
  POMODORO_MODES.long.seconds = pomodoroSettings.long * 60;
  resetPomodoro();
  showToast(t("Налаштування Pomodoro збережено. Таймер скинуто."));
});

// Мобільне бокове меню.
const sidebar = document.querySelector("#sidebar");
const sidebarOverlay = document.querySelector("#sidebar-overlay");

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

document.querySelector("#mobile-menu-button").addEventListener("click", () => {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("show");
});

sidebarOverlay.addEventListener("click", closeSidebar);

// Перемикання між Dashboard і сторінкою «Мої завдання».
document.querySelectorAll("[data-page]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.page);
  });
});

document.querySelector("#view-all-button").addEventListener("click", () => showPage("tasks"));
document.querySelector("#tasks-new-button").addEventListener("click", openCreateModal);

// Пошук і фільтри списку завдань.
elements.tasksSearch.addEventListener("input", renderAllTasks);
elements.tasksStatusFilter.addEventListener("change", renderAllTasks);
elements.tasksCategoryFilter.addEventListener("change", renderAllTasks);

// Кнопки створення завдань на календарі та Kanban.
document.querySelector("#calendar-new-task").addEventListener("click", () => openCreateModal(selectedCalendarDate));
document.querySelector("#kanban-new-task").addEventListener("click", openCreateModal);

// Перемикання режимів календаря.
document.querySelectorAll("[data-calendar-view]").forEach(button => {
  button.addEventListener("click", () => {
    calendarView = button.dataset.calendarView;
    renderCalendar();
  });
});

// Перемикання попереднього та наступного періоду календаря.
document.querySelector("#calendar-prev").addEventListener("click", () => {
  if (calendarView === "month") {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    selectedCalendarDate = dateToKey(calendarMonth);
  } else {
    const selected = new Date(`${selectedCalendarDate}T00:00:00`);
    selected.setDate(selected.getDate() - (calendarView === "week" ? 7 : 1));
    selectedCalendarDate = dateToKey(selected);
    calendarMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  }
  renderCalendar();
});

document.querySelector("#calendar-next").addEventListener("click", () => {
  if (calendarView === "month") {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    selectedCalendarDate = dateToKey(calendarMonth);
  } else {
    const selected = new Date(`${selectedCalendarDate}T00:00:00`);
    selected.setDate(selected.getDate() + (calendarView === "week" ? 7 : 1));
    selectedCalendarDate = dateToKey(selected);
    calendarMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  }
  renderCalendar();
});

document.querySelector("#calendar-today").addEventListener("click", () => {
  selectedCalendarDate = getToday();
  const today = new Date();
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
});

// Перетворюємо дату та час завдання на timestamp дедлайну.
// Якщо час не заданий, вважаємо дедлайном кінець вибраного дня.
function getTaskDeadline(task) {
  if (!task.date) return null;
  const deadline = new Date(`${task.date}T${task.time || "23:59"}:00`);
  return Number.isNaN(deadline.getTime()) ? null : deadline.getTime();
}

function saveNotifications() {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  scheduleTaskFlowCloudSave();
}

function getUnreadNotificationCount() {
  return notifications.filter(item => !item.read).length;
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  }).format(date);
}

// Текст сповіщення будуємо під час показу, тому він завжди відповідає поточній мові.
// Старі записи (без taskTitle) показуємо так, як вони були збережені.
function getNotificationTexts(item) {
  if (item.taskTitle === undefined) return { title: item.title, message: item.message };
  const days = Number(item.days) || 0;
  // Назву беремо з актуального завдання, щоб демо-завдання відповідали мові інтерфейсу.
  const sourceTask = tasks.find(task => task.id === item.taskId);
  const taskName = sourceTask ? taskTitle(sourceTask) : item.taskTitle;
  const titles = {
    overdue: t("Завдання прострочене"),
    "reminder-1h": t("До дедлайну менше години"),
    "reminder-6h": t("До дедлайну менше 6 годин"),
    "reminder-12h": t("До дедлайну менше 12 годин"),
    "reminder-day": days === 0 ? t("Дедлайн сьогодні")
      : days === 1 ? t("Дедлайн завтра")
      : days === 7 ? t("Дедлайн через тиждень")
      : t("Дедлайн через {n} дн.", { n: days })
  };
  return {
    title: titles[item.type] || t("Сповіщення"),
    message: item.type === "overdue"
      ? t("«{title}» не виконано. Перевір дедлайн.", { title: taskName })
      : t("Не забудь виконати завдання «{title}».", { title: taskName })
  };
}

// Короткий звуковий сигнал (потрібен, коли ввімкнено «Звук сповіщень»).
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.42);
    oscillator.onended = () => context.close();
  } catch (error) {
    /* Браузер може блокувати звук до першої взаємодії зі сторінкою. */
  }
}

// Оновлюємо список та лічильник у центрі сповіщень.
function renderNotifications() {
  const list = document.querySelector("#notification-list");
  const empty = document.querySelector("#notification-empty");
  const count = document.querySelector("#notification-count");
  const summary = document.querySelector("#notification-summary");
  const unread = getUnreadNotificationCount();

  count.textContent = unread > 99 ? "99+" : String(unread);
  count.hidden = unread === 0;
  summary.textContent = unread ? t("Непрочитаних: {n}", { n: unread }) : t("Усе під контролем");
  list.innerHTML = "";
  empty.hidden = notifications.length > 0;

  notifications.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `notification-item${item.read ? "" : " unread"}`;
    button.dataset.notificationId = item.id;
    button.dataset.taskId = item.taskId;

    const icon = document.createElement("span");
    icon.className = `notification-item-icon${item.type === "overdue" ? " overdue" : ""}`;
    const iconElement = document.createElement("i");
    iconElement.setAttribute("data-lucide", item.type === "overdue" ? "alert-circle" : "clock-3");
    icon.append(iconElement);

    const texts = getNotificationTexts(item);
    const content = document.createElement("span");
    content.className = "notification-item-content";
    const title = document.createElement("strong");
    title.textContent = texts.title;
    const message = document.createElement("span");
    message.textContent = texts.message;
    const time = document.createElement("small");
    time.textContent = formatNotificationTime(item.createdAt);
    content.append(title, message, time);

    const unreadDot = document.createElement("span");
    unreadDot.className = "notification-unread-dot";
    if (item.read) unreadDot.hidden = true;

    button.append(icon, content, unreadDot);
    list.append(button);
  });

  refreshIcons();
}

function addTaskNotification(task, type, days = 0) {
  const deadline = getTaskDeadline(task);
  if (!deadline) return;
  const id = `${task.id}_${deadline}_${type}`;
  if (notifications.some(item => item.id === id)) return;

  const notification = {
    id,
    taskId: task.id,
    taskTitle: taskTitle(task),
    type,
    days,
    createdAt: new Date().toISOString(),
    read: false
  };

  notifications.unshift(notification);
  // Зберігаємо останні 100 сповіщень, щоб історія не зростала безмежно.
  notifications = notifications.slice(0, 100);
  saveNotifications();
  renderNotifications();

  // Системне повідомлення з'являється, лише якщо воно ввімкнене в налаштуваннях і дозволене браузером.
  if (extraSettings.browserNotifications && "Notification" in window && Notification.permission === "granted") {
    const texts = getNotificationTexts(notification);
    new Notification(texts.title, { body: texts.message, tag: id });
  }
  if (extraSettings.notificationSound) playNotificationSound();
}

// Перевіряємо дедлайни. Кожен етап має власний часовий проміжок,
// тому при відкритому сайті одне нагадування не дублює інше.
function checkTaskReminders() {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  // Налаштування «Нагадувати заздалегідь»: 0 — у день дедлайну, інакше — за N днів.
  const reminderDays = Number(extraSettings.reminderDays) || 0;

  tasks.forEach(task => {
    if (task.status === "completed") return;
    const deadline = getTaskDeadline(task);
    if (!deadline) return;
    const remaining = deadline - now;

    if (remaining <= 0) {
      addTaskNotification(task, "overdue");
      return;
    }

    if (remaining <= hour) {
      addTaskNotification(task, "reminder-1h");
    } else if (remaining <= 6 * hour) {
      addTaskNotification(task, "reminder-6h");
    } else if (remaining <= 12 * hour) {
      addTaskNotification(task, "reminder-12h");
    } else if (reminderDays === 0 ? task.date === getToday() : remaining <= reminderDays * 24 * hour) {
      addTaskNotification(task, "reminder-day", reminderDays);
    }
  });
}

const notificationButton = document.querySelector("#notification-button");
const notificationPanel = document.querySelector("#notification-panel");

notificationButton.addEventListener("click", () => {
  const willOpen = notificationPanel.hidden;
  notificationPanel.hidden = !willOpen;
  notificationButton.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) renderNotifications();
});

document.addEventListener("click", event => {
  if (!event.target.closest(".notification-wrapper")) {
    notificationPanel.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});

document.querySelector("#notification-list").addEventListener("click", event => {
  const item = event.target.closest(".notification-item");
  if (!item) return;
  const notification = notifications.find(entry => entry.id === item.dataset.notificationId);
  if (notification && !notification.read) {
    notification.read = true;
    saveNotifications();
    renderNotifications();
  }
  const task = tasks.find(entry => entry.id === item.dataset.taskId);
  notificationPanel.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
  if (task) openEditModal(task.id);
});

document.querySelector("#mark-all-notifications-read").addEventListener("click", () => {
  notifications = notifications.map(item => ({ ...item, read: true }));
  saveNotifications();
  renderNotifications();
});

document.querySelector("#enable-browser-notifications").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast(t("Цей браузер не підтримує системні сповіщення."));
    return;
  }
  const permission = await Notification.requestPermission();
  // Кнопка в центрі сповіщень і перемикач у налаштуваннях керують одним і тим самим параметром.
  extraSettings.browserNotifications = permission === "granted";
  const checkbox = document.querySelector("#setting-browser-notifications");
  if (checkbox) checkbox.checked = extraSettings.browserNotifications;
  saveExtraSettings();
  showToast(permission === "granted"
    ? t("Системні сповіщення увімкнено.")
    : t("Дозвіл на системні сповіщення не надано."));
});

document.querySelector("#profile-button").addEventListener("click", () => showPage("profile"));
document.querySelector("#top-avatar").addEventListener("click", () => showPage("profile"));

// Оновлюємо іконки Lucide, якщо бібліотека завантажилася.
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Початкове відображення Dashboard.
refreshCategorySelects();
renderCurrentDate();
renderUserName();
updatePageTitle();
// ==============================
// СИНХРОНІЗАЦІЯ З CLOUD FIRESTORE
// ==============================

let cloudSaveTimeout = null;

// Формуємо єдиний об'єкт із даними, які потрібно зберігати в хмарі.
function getTaskFlowCloudData() {
  return {
    tasks,
    categories,
    pomodoroData,
    pomodoroSettings,
    notifications,
    profile: userProfile,
    extraSettings,
    taskTrash,
    quickNotes
  };
}

// Відкладаємо запис на короткий час, щоб не надсилати запит після кожної зміни.
function scheduleTaskFlowCloudSave() {
  if (!window.taskFlowCloudReady || !window.taskFlowCloud?.saveCloudData) return;

  clearTimeout(cloudSaveTimeout);
  cloudSaveTimeout = setTimeout(async () => {
    try {
      await window.taskFlowCloud.saveCloudData(getTaskFlowCloudData());
    } catch (error) {
      console.error("Не вдалося синхронізувати TaskFlow з хмарою:", error);
      showToast(t("Не вдалося зберегти дані у хмарі. Перевір з'єднання."));
    }
  }, 500);
}

// Цю функцію викликає firebase-firestore.js після завантаження документа.
window.applyTaskFlowCloudData = function (cloudData) {
  if (Array.isArray(cloudData.tasks)) {
    tasks = cloudData.tasks.map(normalizeTask);
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  if (Array.isArray(cloudData.categories) && cloudData.categories.length) {
    categories = cloudData.categories;
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    refreshCategorySelects();
  }

  if (cloudData.pomodoroData && Array.isArray(cloudData.pomodoroData.sessions)) {
    pomodoroData = {
      sessions: cloudData.pomodoroData.sessions,
      minuteLogs: Array.isArray(cloudData.pomodoroData.minuteLogs)
        ? cloudData.pomodoroData.minuteLogs : []
    };
    localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoroData));
  }

  if (cloudData.pomodoroSettings) {
    pomodoroSettings = {
      focus: Math.min(90, Math.max(1, Number(cloudData.pomodoroSettings.focus) || 25)),
      short: Math.min(30, Math.max(1, Number(cloudData.pomodoroSettings.short) || 5)),
      long: Math.min(60, Math.max(1, Number(cloudData.pomodoroSettings.long) || 15))
    };
    localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(pomodoroSettings));
    POMODORO_MODES.focus.seconds = pomodoroSettings.focus * 60;
    POMODORO_MODES.short.seconds = pomodoroSettings.short * 60;
    POMODORO_MODES.long.seconds = pomodoroSettings.long * 60;
  }

  if (Array.isArray(cloudData.notifications)) {
    notifications = cloudData.notifications;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    renderNotifications();
  }

  if (cloudData.profile && typeof cloudData.profile === "object") {
    userProfile = {
      name: cloudData.profile.name || userProfile.name,
      about: cloudData.profile.about || "",
      avatar: cloudData.profile.avatar || ""
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    localStorage.setItem(USER_KEY, userProfile.name);
    renderProfile();
  }

  if (cloudData.extraSettings && typeof cloudData.extraSettings === "object") {
    Object.assign(extraSettings, cloudData.extraSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(extraSettings));
    syncExtraSettingsUI();
    // Мову з хмари застосовуємо без сповіщення, лише якщо вона відрізняється від поточної.
    if (extraSettings.language && extraSettings.language !== getLanguage()) {
      applyLanguage(extraSettings.language, { silent: true });
    }
  }
  if (Array.isArray(cloudData.taskTrash)) { taskTrash = cloudData.taskTrash; localStorage.setItem("taskflow-trash", JSON.stringify(taskTrash)); }
  if (Array.isArray(cloudData.quickNotes)) { quickNotes = cloudData.quickNotes; localStorage.setItem("taskflow-quick-notes", JSON.stringify(quickNotes)); }
  renderQuickNotes();
  renderTrashCount();
  renderDashboard();
  renderAllTasks();
  renderNotifications();
  checkTaskReminders();
  renderCalendar();
  renderKanban();
  renderPomodoroTimer();
  renderPomodoroStats();
  renderAnalytics();
};

// Firestore використовує цей знімок для першого перенесення локальних даних.
window.getTaskFlowCloudData = getTaskFlowCloudData;

renderDashboard();
renderAllTasks();
renderNotifications();
checkTaskReminders();
setInterval(checkTaskReminders, 60 * 1000);
renderPomodoroTimer();
renderPomodoroStats();
refreshIcons();


// ==============================
// РОЗШИРЕНІ НАЛАШТУВАННЯ ТА ДОДАТКОВІ МОЖЛИВОСТІ
// ==============================
function saveExtraSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(extraSettings));
  scheduleTaskFlowCloudSave();
}
function adjustHex(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function applyAccent(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  // Встановлюємо змінні на body, щоб акцент не перезаписувався темною темою.
  document.body.style.setProperty("--primary", color);
  document.body.style.setProperty("--accent", color);
  document.body.style.setProperty("--primary-color", color);
  document.body.style.setProperty("--accent-dark", adjustHex(color, -18));
  document.body.style.setProperty("--accent-soft", `${color}20`);
  localStorage.setItem("taskflow-accent", color);
}
const accentInput = document.querySelector("#settings-accent");
const languageInput = document.querySelector("#settings-language");
const themeSelect = document.querySelector("#settings-theme");
if (accentInput) {
  accentInput.value = localStorage.getItem("taskflow-accent") || "#7667f8";
  applyAccent(accentInput.value);
  accentInput.addEventListener("input", () => applyAccent(accentInput.value));
}
if (themeSelect) {
  themeSelect.value = localStorage.getItem(THEME_KEY) || "light";
  themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
}
if (languageInput) {
  languageInput.value = getLanguage();
  languageInput.addEventListener("change", () => applyLanguage(languageInput.value));
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if ((localStorage.getItem(THEME_KEY) || "light") === "system") applyTheme("system");
});
const browserNotify = document.querySelector("#setting-browser-notifications");
const soundNotify = document.querySelector("#setting-notification-sound");
const reminderTime = document.querySelector("#setting-reminder-time");
// Показуємо у формі збережені значення (викликається при старті та після завантаження з хмари).
function syncExtraSettingsUI() {
  if (browserNotify) browserNotify.checked = Boolean(extraSettings.browserNotifications)
    && "Notification" in window && Notification.permission === "granted";
  if (soundNotify) soundNotify.checked = Boolean(extraSettings.notificationSound);
  if (reminderTime) reminderTime.value = String(extraSettings.reminderDays ?? 0);
}
syncExtraSettingsUI();
if (browserNotify) {
  browserNotify.addEventListener("change", async () => {
    if (browserNotify.checked) {
      if (!("Notification" in window)) {
        showToast(t("Цей браузер не підтримує системні сповіщення."));
        extraSettings.browserNotifications = false;
      } else {
        const permission = await Notification.requestPermission();
        extraSettings.browserNotifications = permission === "granted";
        if (permission !== "granted") showToast(t("Дозвіл на системні сповіщення не надано."));
      }
      browserNotify.checked = extraSettings.browserNotifications;
    } else extraSettings.browserNotifications = false;
    saveExtraSettings();
  });
}
if (soundNotify) {
  soundNotify.addEventListener("change", () => {
    extraSettings.notificationSound = soundNotify.checked;
    saveExtraSettings();
    if (soundNotify.checked) playNotificationSound(); // Одразу даємо почути сигнал.
  });
}
if (reminderTime) {
  reminderTime.addEventListener("change", () => {
    extraSettings.reminderDays = Number(reminderTime.value);
    saveExtraSettings();
    checkTaskReminders(); // Нове значення діє одразу, без перезавантаження.
  });
}
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}
document.querySelector("#export-json")?.addEventListener("click", () => {
  downloadFile("taskflow-backup.json", JSON.stringify(getTaskFlowCloudData(), null, 2), "application/json");
  showToast(t("Експорт JSON підготовлено."));
});
document.querySelector("#export-csv")?.addEventListener("click", () => {
  const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [["ID", t("Назва"), t("Опис"), t("Дата"), t("Час"), t("Категорія"), t("Статус"), t("Пріоритет")],
    ...tasks.map(t => [t.id,t.title,t.description,t.date,t.time,t.category,t.status,t.priority])];
  downloadFile("taskflow-tasks.csv", "\uFEFF" + rows.map(row => row.map(quote).join(",")).join("\n"), "text/csv;charset=utf-8");
  showToast(t("Експорт CSV підготовлено."));
});
document.querySelector("#delete-all-tasks")?.addEventListener("click", async () => {
  if (!tasks.length) return showToast(t("Немає завдань для видалення."));
  const approved = await showConfirm(t("Перемістити всі завдання ({n}) у кошик?", { n: tasks.length }), t("Видалити всі завдання?"), t("Перемістити"));
  if (!approved) return;
  taskTrash.push(...tasks.map(t => ({...t, deletedAt: new Date().toISOString()})));
  localStorage.setItem(TRASH_KEY, JSON.stringify(taskTrash));
  renderTrashCount();
  tasks = []; saveTasks(); renderDashboard(); renderAllTasks(); renderCalendar(); renderKanban();
  showToast(t("Усі завдання переміщено в кошик."));
});
function saveQuickNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(quickNotes));
  scheduleTaskFlowCloudSave(); // Раніше нотатки не потрапляли в хмару й зникали після перезавантаження.
}
document.querySelector("#save-quick-note")?.addEventListener("click", () => {
  const field = document.querySelector("#quick-note");
  const value = field.value.trim();
  if (!value) return showToast(t("Спочатку введи текст нотатки."));
  quickNotes.unshift({ id: Date.now(), text: value, createdAt: new Date().toISOString() });
  saveQuickNotes();
  field.value = "";
  renderQuickNotes();
  showToast(t("Нотатку збережено."));
});
function renderQuickNotes() {
  const target = document.querySelector("#quick-notes-list");
  if (!target) return;
  target.innerHTML = "";
  if (!quickNotes.length) {
    target.textContent = t("Нотаток поки немає.");
    return;
  }
  quickNotes.forEach(note => {
    const row = document.createElement("div");
    row.className = "quick-note-item";
    const text = document.createElement("span");
    text.textContent = note.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "task-action delete";
    remove.title = t("Видалити нотатку");
    remove.setAttribute("aria-label", t("Видалити нотатку"));
    remove.innerHTML = '<i data-lucide="x"></i>';
    remove.addEventListener("click", () => {
      quickNotes = quickNotes.filter(item => item.id !== note.id);
      saveQuickNotes();
      renderQuickNotes();
      showToast(t("Нотатку видалено."));
    });
    row.append(text, remove);
    target.append(row);
  });
  refreshIcons();
}
// Кнопка «Мої нотатки» показує або ховає список.
document.querySelector("#show-quick-notes")?.addEventListener("click", () => {
  const target = document.querySelector("#quick-notes-list");
  target.hidden = !target.hidden;
});
renderQuickNotes();

// Досягнення та streak за датами виконаних завдань.
function renderTaskFlowAchievements() {
  const completed = tasks.filter(t => t.status === "completed");
  // completedAt може бути рядком YYYY-MM-DD або повним ISO-часом (старі дані) — зводимо до локального дня.
  const completionDay = task => {
    const value = task.completedAt;
    if (!value) return task.date;
    if (String(value).length === 10) return String(value);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : dateToKey(parsed);
  };
  const days = [...new Set(completed.map(completionDay).filter(Boolean))].sort().reverse();
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0,0,0,0);
  if (days[0] !== dateToKey(cursor)) cursor.setDate(cursor.getDate()-1);
  while (days.includes(dateToKey(cursor))) { streak++; cursor.setDate(cursor.getDate()-1); }
  const achievements = [completed.length >= 1, completed.length >= 10, completed.length >= 50, streak >= 3, streak >= 7].filter(Boolean).length;
  const el = document.querySelector("#taskflow-streak");
  if (el) el.textContent = t("Streak: {streak} дн. · Досягнення: {ach}/5 · Виконано: {done}", { streak, ach: achievements, done: completed.length });
}
renderTaskFlowAchievements();

// Обране: позначка зберігається безпосередньо в об'єкті завдання.
document.addEventListener("click", event => {
  const button = event.target.closest("[data-task-favorite]");
  if (!button) return;
  const task = tasks.find(t => String(t.id) === button.dataset.taskFavorite);
  if (!task) return;
  task.favorite = !task.favorite; saveTasks(); renderDashboard(); renderAllTasks();
});

document.querySelector("#restore-trash")?.addEventListener("click", openTrash);
document.querySelector("#sidebar-trash-button")?.addEventListener("click", () => { openTrash(); closeSidebar(); });

function renderTrashCount() {
  ["#trash-count", "#sidebar-trash-count"].forEach(selector => {
    const count = document.querySelector(selector);
    if (count) count.textContent = taskTrash.length;
  });
}
function openTrash() {
  renderTrash();
  const modal = document.querySelector("#trash-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  refreshIcons();
}
function closeTrash() {
  const modal = document.querySelector("#trash-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
function renderTrash() {
  const list = document.querySelector("#trash-list");
  const summary = document.querySelector("#trash-summary");
  if (!list) return;
  summary.textContent = taskTrash.length
    ? t("У кошику: {n} {tasks}. Їх можна відновити або видалити назавжди.", { n: taskTrash.length, tasks: plural(taskTrash.length, "task") })
    : t("Кошик порожній. Видалені завдання з’являтимуться тут.");
  list.innerHTML = "";
  if (!taskTrash.length) {
    list.innerHTML = '<div class="trash-empty"><i data-lucide="archive"></i><p></p></div>';
    list.querySelector("p").textContent = t("Кошик порожній");
  } else {
    taskTrash.slice().sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0)).forEach(task => {
      const item = document.createElement("article");
      item.className = "trash-item";
      const info = document.createElement("div");
      info.className = "trash-item-info";
      const title = document.createElement("strong");
      title.textContent = taskTitle(task) || t("Без назви");
      const date = document.createElement("small");
      date.textContent = t("Видалено: {date}", { date: task.deletedAt ? new Date(task.deletedAt).toLocaleString(getLocale()) : t("невідомо") });
      info.append(title, date);
      const actions = document.createElement("div");
      actions.className = "trash-item-actions";
      const restore = document.createElement("button");
      restore.className = "secondary-button"; restore.type = "button"; restore.textContent = t("Відновити");
      restore.addEventListener("click", () => restoreTrashTask(task.id));
      const remove = document.createElement("button");
      remove.className = "danger-button"; remove.type = "button"; remove.textContent = t("Видалити назавжди");
      remove.addEventListener("click", () => permanentlyDeleteTrashTask(task.id));
      actions.append(restore, remove); item.append(info, actions); list.append(item);
    });
  }
  renderTrashCount(); refreshIcons();
}
async function restoreTrashTask(id) {
  const index = taskTrash.findIndex(task => String(task.id) === String(id));
  if (index < 0) return;
  const { deletedAt, ...task } = taskTrash.splice(index, 1)[0];
  tasks.push(normalizeTask({ ...task, status: task.status || "planned" }));
  localStorage.setItem(TRASH_KEY, JSON.stringify(taskTrash));
  saveTasks(); renderDashboard(); renderAllTasks(); renderCalendar(); renderKanban(); renderTrash();
  showToast(t("Завдання відновлено."));
}
async function permanentlyDeleteTrashTask(id) {
  const approved = await showConfirm(t("Це завдання буде видалено без можливості відновлення."), t("Видалити назавжди?"), t("Видалити"));
  if (!approved) return;
  taskTrash = taskTrash.filter(task => String(task.id) !== String(id));
  localStorage.setItem(TRASH_KEY, JSON.stringify(taskTrash));
  scheduleTaskFlowCloudSave(); renderTrash(); showToast(t("Завдання остаточно видалено."));
}
document.querySelector("#empty-trash")?.addEventListener("click", async () => {
  if (!taskTrash.length) return showToast(t("Кошик уже порожній."));
  const approved = await showConfirm(t("Остаточно видалити завдання з кошика ({n})?", { n: taskTrash.length }), t("Очистити кошик?"), t("Видалити назавжди"));
  if (!approved) return;
  taskTrash = []; localStorage.setItem(TRASH_KEY, JSON.stringify(taskTrash));
  scheduleTaskFlowCloudSave(); renderTrash(); showToast(t("Кошик очищено."));
});
["close-trash-modal", "close-trash-bottom"].forEach(id => document.querySelector(`#${id}`)?.addEventListener("click", closeTrash));
document.querySelector("#trash-modal")?.addEventListener("click", event => { if (event.target.id === "trash-modal") closeTrash(); });
renderTrashCount();


// ==============================
// ПЕРЕМИКАННЯ МОВИ
// ==============================
// Динамічні рядки створюються через t(), статичний HTML перекладає applyStaticTranslations().
// Після зміни мови перемальовуємо всі частини інтерфейсу, які формуються кодом.
function applyLanguage(language, { silent = false } = {}) {
  setLanguageState(language);
  extraSettings.language = getLanguage();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(extraSettings));
  scheduleTaskFlowCloudSave();

  applyStaticTranslations();
  updatePageTitle();
  renderCurrentDate();
  renderUserName();
  renderProfile();
  renderCategories();
  renderDashboard();
  renderNotifications();
  renderPomodoroTimer();
  renderPomodoroStats();
  renderQuickNotes();
  renderTrash();
  resetCategoryFormLabels();
  const theme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(theme); // Оновлює підпис кнопки теми.
  if (languageInput) languageInput.value = getLanguage();
  document.dispatchEvent(new CustomEvent("taskflow-language", { detail: getLanguage() }));

  if (!silent) showToast(t(getLanguage() === "en" ? "English language enabled." : "Українську мову увімкнено."));
}

// Якщо форма категорії зараз у режимі редагування, лишаємо її заголовки відповідними.
function resetCategoryFormLabels() {
  const editing = Boolean(document.querySelector("#category-id").value);
  document.querySelector("#category-form-title").textContent = t(editing ? "Редагувати категорію" : "Нова категорія");
  document.querySelector("#category-submit-label").textContent = t(editing ? "Зберегти зміни" : "Додати категорію");
}

// Початкове застосування мови та відкриття розділу з адреси (#tasks, #calendar...).
applyStaticTranslations();
updatePageTitle();
renderCurrentDate();
renderDashboard();
renderPomodoroTimer();
renderTrash();
{
  const initialPage = location.hash.slice(1);
  if (PAGE_TITLES[initialPage] && initialPage !== "dashboard") showPage(initialPage);
}

// Після півночі оновлюємо дату та списки «на сьогодні».
let lastRenderedDay = getToday();
setInterval(() => {
  if (getToday() === lastRenderedDay) return;
  lastRenderedDay = getToday();
  renderCurrentDate();
  renderDashboard();
}, 60 * 1000);
