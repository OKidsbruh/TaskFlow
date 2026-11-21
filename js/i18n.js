// ==============================
// TASKFLOW — ЛОКАЛІЗАЦІЯ (uk / en)
// Ключі — українські рядки (це мова за замовчуванням), значення — англійські.
// t("Текст", { параметр }) повертає рядок поточною мовою.
// Статичний HTML перекладається за збереженими оригіналами (без втрати українського тексту).
// ==============================

const LANGUAGE_STORAGE_KEY = "taskflow-language";
const SUPPORTED_LANGUAGES = ["uk", "en"];

function readStoredLanguage() {
  try {
    const direct = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(direct)) return direct;
    // Сумісність зі старою версією, де мова зберігалась разом з іншими налаштуваннями.
    const legacy = JSON.parse(localStorage.getItem("taskflow-extra-settings") || "{}").language;
    if (SUPPORTED_LANGUAGES.includes(legacy)) return legacy;
  } catch (error) { /* ігноруємо пошкоджені дані */ }
  return "uk";
}

let currentLanguage = readStoredLanguage();

const TASKFLOW_EN = {
  // ----- Навігація та загальні елементи -----
  "TaskFlow — простір для планування завдань і керування продуктивністю.": "TaskFlow — a workspace for planning tasks and managing productivity.",
  "TaskFlow — головна": "TaskFlow — home",
  "Головна навігація": "Main navigation",
  "Огляд": "Overview",
  "Мої завдання": "My tasks",
  "Календар": "Calendar",
  "Аналітика": "Analytics",
  "Статистика": "Statistics",
  "Особисті розділи": "Personal sections",
  "Категорії": "Categories",
  "Мій профіль": "My profile",
  "Налаштування": "Settings",
  "Працюй зосереджено": "Stay focused",
  "Маленькі кроки створюють великі результати.": "Small steps create big results.",
  "Особистий простір": "Personal workspace",
  "Відкрити меню": "Open menu",
  "Сповіщення": "Notifications",
  "Центр сповіщень": "Notification center",
  "Усе під контролем": "Everything is under control",
  "Прочитати всі": "Mark all as read",
  "Поки немає сповіщень": "No notifications yet",
  "Тут з’являтимуться нагадування про дедлайни.": "Deadline reminders will appear here.",
  "Увімкнути системні сповіщення": "Enable system notifications",
  "Перемкнути тему": "Toggle theme",
  "Профіль": "Profile",

  // ----- Огляд -----
  "ТВІЙ ПРОСТІР ПРОДУКТИВНОСТІ": "YOUR PRODUCTIVITY SPACE",
  "Доброго ранку,": "Good morning,",
  "Доброго дня,": "Good afternoon,",
  "Доброго вечора,": "Good evening,",
  "Доброї ночі,": "Good night,",
  "Ось що відбувається з твоїми завданнями сьогодні.": "Here is what's happening with your tasks today.",
  "Нове завдання": "New task",
  "Статистика завдань": "Task statistics",
  "Усі завдання": "All tasks",
  "Загалом у просторі": "Total in workspace",
  "Виконано": "Completed",
  "Чудова робота!": "Great work!",
  "У процесі": "In progress",
  "Заплановано або виконується": "Planned or in progress",
  "Прострочено": "Overdue",
  "Потребують уваги": "Need attention",
  "Твій прогрес": "Your progress",
  "Загальний огляд виконання": "Overall completion overview",
  "За весь час": "All time",
  "виконано": "completed",
  "Кожен крок має значення": "Every step matters",
  "Продовжуй рухатися до своїх цілей. Твій прогрес оновлюється автоматично.": "Keep moving toward your goals. Your progress updates automatically.",
  "Залишилося": "Remaining",
  "ФОКУС ДНЯ": "FOCUS OF THE DAY",
  "Маленькі кроки —": "Small steps —",
  "великі результати.": "big results.",
  "Обери найважливіше завдання та приділи йому час сьогодні.": "Choose your most important task and make time for it today.",
  "Ти впораєшся!": "You can do it!",
  "Завдання на сьогодні": "Today's tasks",
  "Тримай важливе під контролем": "Keep what matters under control",
  "На сьогодні завдань немає": "No tasks for today",
  "Можеш відпочити або додати нове завдання.": "You can take a break or add a new task.",
  "Додати завдання": "Add task",

  // ----- Список завдань -----
  "Керуй усіма своїми справами в одному місці.": "Manage everything you need to do in one place.",
  "Пошук завдань...": "Search tasks...",
  "Пошук завдань": "Search tasks",
  "Фільтр за статусом": "Filter by status",
  "Усі статуси": "All statuses",
  "Заплановані": "Planned",
  "На перевірці": "In review",
  "Виконані": "Completed",
  "Обрані": "Favorites",
  "Фільтр за категорією": "Filter by category",
  "Усі категорії": "All categories",
  "Навчання": "Study",
  "Робота": "Work",
  "Особисте": "Personal",
  "Покупки": "Shopping",
  "Інше": "Other",
  "Список завдань": "Task list",
  "Усі завдання у твоєму просторі": "All tasks in your workspace",
  "За датою": "By date",
  "Завдань не знайдено": "No tasks found",
  "Спробуй змінити фільтри або створи нове завдання.": "Try changing the filters or create a new task.",
  "Показано: {shown} із {total}": "Showing {shown} of {total}",
  "Позначити невиконаним": "Mark as not completed",
  "Позначити виконаним": "Mark as completed",
  "Підзавдання: {done}/{total}": "Subtasks: {done}/{total}",
  "Прибрати з обраного": "Remove from favorites",
  "Додати в обране": "Add to favorites",
  "Редагувати": "Edit",
  "Редагувати завдання": "Edit task",
  "Видалити": "Delete",
  "Видалити завдання": "Delete task",
  "Сьогодні": "Today",
  "Завтра": "Tomorrow",

  // ----- Календар -----
  "Переглядай завдання за датами та плануй свій час.": "Browse tasks by date and plan your time.",
  "Обери день, щоб переглянути заплановане": "Choose a day to see what's planned",
  "Режим календаря": "Calendar view",
  "Місяць": "Month",
  "Тиждень": "Week",
  "День": "Day",
  "Попередній період": "Previous period",
  "Наступний період": "Next period",
  "Пн": "Mon", "Вт": "Tue", "Ср": "Wed", "Чт": "Thu", "Пт": "Fri", "Сб": "Sat", "Нд": "Sun",
  "Є завдання": "Has tasks",
  "Завдання на день": "Tasks for the day",
  "Обрана дата": "Selected date",
  "На цю дату завдань немає.": "No tasks for this date.",

  // ----- Kanban -----
  "Перетягуй картки між колонками, щоб змінювати статус завдань.": "Drag cards between columns to change task status.",
  "Заплановано": "Planned",
  "Щоб змінити статус, перетягни картку в іншу колонку.": "To change the status, drag the card to another column.",
  "Перетягни сюди завдання": "Drop a task here",
  "Статус завдання змінено.": "Task status changed.",

  // ----- Статистика -----
  "Відстежуй виконання завдань і власну продуктивність.": "Track your task completion and personal productivity.",
  "Усього завдань": "Total tasks",
  "У твоєму просторі": "In your workspace",
  "{pct}% від усіх завдань": "{pct}% of all tasks",
  "Фокус-час": "Focus time",
  "Накопичено хвилин фокусу": "Total minutes of focus",
  "Сесії сьогодні": "Sessions today",
  "Завершені фокус-сесії": "Completed focus sessions",
  "Завдання за статусами": "Tasks by status",
  "Поточний розподіл": "Current distribution",
  "Кількість завдань у кожній категорії": "Number of tasks in each category",
  "Фокус за останні 7 днів": "Focus over the last 7 days",
  "Хвилини завершених Pomodoro-сесій": "Minutes from completed Pomodoro sessions",
  "{n} хв": "{n} min",

  // ----- Pomodoro -----
  "Працюй короткими зосередженими інтервалами та вчасно відпочивай.": "Work in short focused intervals and rest on time.",
  "Режим таймера": "Timer mode",
  "Фокус": "Focus",
  "Коротка перерва": "Short break",
  "Довга перерва": "Long break",
  "Час зосередитися": "Time to focus",
  "Почати": "Start",
  "Пауза": "Pause",
  "Скинути": "Reset",
  "Після фокус-сесії почнеться коротка перерва.": "A short break starts after the focus session.",
  "Чудова робота! Час на довшу перерву.": "Great job! Time for a longer break.",
  "Фокус-сесію завершено. Час трохи відпочити.": "Focus session complete. Time to rest a little.",
  "Перерва завершена. Можна починати наступну фокус-сесію.": "Break is over. You can start the next focus session.",
  "Pomodoro-сесію завершено!": "Pomodoro session complete!",
  "Завдання для фокусу": "Task to focus on",
  "Необов'язково": "Optional",
  "Без конкретного завдання": "No specific task",
  "Завершено сесій": "Sessions completed",
  "Час фокусу": "Focus time",
  "Усього сесій": "Total sessions",
  "Порада": "Tip",
  "Прибери зайві вкладки та сповіщення, щоб зосередитися на одному завданні.": "Close extra tabs and notifications to concentrate on one task.",

  // ----- Категорії -----
  "Створюй власні категорії та впорядковуй завдання за напрямами.": "Create your own categories and organize tasks by area.",
  "Огляд категорій": "Categories overview",
  "Усього категорій": "Total categories",
  "Завдань у категоріях": "Tasks in categories",
  "Найпопулярніша": "Most popular",
  "Мої напрями": "My areas",
  "Обери категорію, щоб переглянути пов’язані завдання.": "Choose a category to see its related tasks.",
  "Нова категорія": "New category",
  "Редагувати категорію": "Edit category",
  "Назва та колір допоможуть швидко знаходити потрібні завдання.": "A name and a color help you find the right tasks quickly.",
  "Назва категорії": "Category name",
  "Наприклад, Навчання": "For example, Study",
  "Колір категорії": "Category color",
  "Обери колір для позначки категорії": "Pick a color for the category label",
  "Скасувати": "Cancel",
  "Додати категорію": "Add category",
  "Зберегти зміни": "Save changes",
  "Мої категорії": "My categories",
  "Якщо видалити категорію, її завдання автоматично перейдуть у категорію «Інше».": "If you delete a category, its tasks automatically move to “Other”.",
  "Переглянути": "View",
  "Видалити категорію": "Delete category",
  "Редагувати {name}": "Edit {name}",
  "Видалити {name}": "Delete {name}",
  "Видалити категорію «{name}»? Її завдання буде перенесено в «Інше».": "Delete the “{name}” category? Its tasks will be moved to “Other”.",
  "Видалити категорію?": "Delete category?",
  "Так, видалити": "Yes, delete",
  "Категорію видалено.": "Category deleted.",
  "Категорія з такою назвою вже існує.": "A category with this name already exists.",
  "Категорію оновлено.": "Category updated.",
  "Категорію додано.": "Category added.",

  // ----- Профіль та вхід -----
  "Керуй інформацією, яка відображається у твоєму просторі TaskFlow.": "Manage the information shown in your TaskFlow workspace.",
  "Увійти в TaskFlow": "Sign in to TaskFlow",
  "Увійди, щоб використовувати особистий профіль.": "Sign in to use your personal profile.",
  "Увійди, щоб відкрити свій профіль TaskFlow.": "Sign in to open your TaskFlow profile.",
  "Створити акаунт": "Create an account",
  "Зареєструйся за допомогою пошти або Google.": "Sign up with your email or Google.",
  "Вхід": "Sign in",
  "Реєстрація": "Sign up",
  "Ім'я": "Name",
  "Твоє ім'я": "Your name",
  "Електронна пошта": "Email",
  "Пароль": "Password",
  "Мінімум 6 символів": "At least 6 characters",
  "Увійти": "Sign in",
  "Зареєструватися": "Sign up",
  "Зачекай...": "Please wait...",
  "або": "or",
  "Продовжити з Google": "Continue with Google",
  "Особистий простір у TaskFlow": "Your personal TaskFlow workspace",
  "Акаунт TaskFlow": "TaskFlow account",
  "Інформація профілю": "Profile information",
  "Додаткова інформація профілю": "Additional profile information",
  "Способи входу": "Sign-in methods",
  "Пошта Google": "Google email",
  "Створи окремий пароль": "Create a separate password",
  "Прив’язати email і пароль": "Link email and password",
  "Прив’язуємо...": "Linking...",
  "Як до тебе звертатися": "What should we call you",
  "Про себе": "About me",
  "Короткий опис...": "A short description...",
  "Фото профілю": "Profile photo",
  "PNG, JPG або WEBP · до 2 МБ": "PNG, JPG or WEBP · up to 2 MB",
  "Обрати фото": "Choose photo",
  "Прибрати фото": "Remove photo",
  "Зберегти профіль": "Save profile",
  "Вийти з акаунта": "Sign out",
  "Гість": "Guest",
  "Користувач": "User",
  "Вкажи ім'я для профілю.": "Enter a name for your profile.",
  "Профіль збережено.": "Profile saved.",
  "Обери PNG, JPG або WEBP до 2 МБ.": "Choose a PNG, JPG or WEBP up to 2 MB.",
  "Не вдалося обробити зображення.": "Could not process the image.",
  "Фото профілю оновлено.": "Profile photo updated.",
  "Фото профілю прибрано.": "Profile photo removed.",
  "Ти вийшов з акаунта.": "You have signed out.",
  "Вкажи ім'я для реєстрації.": "Enter a name to sign up.",
  "Ця пошта вже зареєстрована або прив’язана до іншого акаунта.": "This email is already registered or linked to another account.",
  "Введи коректну електронну адресу.": "Enter a valid email address.",
  "Пароль має містити щонайменше 6 символів.": "The password must be at least 6 characters long.",
  "Неправильна пошта або пароль.": "Incorrect email or password.",
  "Вікно Google закрито до завершення входу.": "The Google window was closed before sign-in finished.",
  "Додай цей домен до дозволених доменів Firebase Authentication.": "Add this domain to the authorized domains in Firebase Authentication.",
  "Цей спосіб входу ще не ввімкнено у Firebase Console.": "This sign-in method is not enabled in the Firebase Console yet.",
  "Ці дані вже використовуються іншим акаунтом Firebase.": "These credentials are already used by another Firebase account.",
  "Email і пароль уже прив’язані до цього акаунта.": "Email and password are already linked to this account.",
  "Потрібно повторно увійти через Google, а потім спробувати ще раз.": "Please sign in with Google again, then try once more.",
  "Перевір пароль. Він має містити щонайменше 6 символів.": "Check your password. It must be at least 6 characters long.",
  "Забагато спроб. Спробуй трохи пізніше.": "Too many attempts. Please try again later.",
  "Немає з'єднання з інтернетом.": "No internet connection.",
  "Не вдалося виконати дію. Перевір налаштування Firebase та з'єднання.": "Could not complete the action. Check your Firebase settings and connection.",
  "Встанови пароль, щоб надалі входити також через email.": "Set a password to also sign in with email in the future.",
  "Email і пароль успішно прив’язані до твого Google-акаунта.": "Email and password were successfully linked to your Google account.",

  // ----- Налаштування -----
  "Налаштуй вигляд TaskFlow та тривалість фокус-сесій.": "Customize TaskFlow's look and the length of focus sessions.",
  "Зовнішній вигляд": "Appearance",
  "Вибери тему інтерфейсу": "Choose the interface theme",
  "Тема оформлення": "Theme",
  "Можна перемикати у верхній панелі": "Can also be switched in the top bar",
  "Світла": "Light",
  "Темна": "Dark",
  "Системна": "System",
  "Акцентний колір": "Accent color",
  "Колір кнопок та виділення": "Color of buttons and highlights",
  "Мова інтерфейсу": "Interface language",
  "Мова основних підписів": "Language of the interface",
  "Задай тривалість кожного режиму у хвилинах": "Set the length of each mode in minutes",
  "Робочий інтервал": "Working interval",
  "Після фокус-сесії": "After a focus session",
  "Після кожних чотирьох фокус-сесій": "After every four focus sessions",
  "Зберегти налаштування": "Save settings",
  "Перевір допустиму тривалість інтервалів.": "Check the allowed interval lengths.",
  "Налаштування Pomodoro збережено. Таймер скинуто.": "Pomodoro settings saved. The timer was reset.",
  "Налаштуй нагадування та їхній вигляд": "Configure reminders and how they appear",
  "Нагадування у браузері": "Browser reminders",
  "Системні повідомлення про дедлайни": "System notifications about deadlines",
  "Звук сповіщень": "Notification sound",
  "Звуковий сигнал у застосунку": "Sound alert inside the app",
  "Нагадувати заздалегідь": "Remind in advance",
  "Час до дедлайну": "Time before the deadline",
  "У день дедлайну": "On the deadline day",
  "За 1 день": "1 day before",
  "За 2 дні": "2 days before",
  "За тиждень": "1 week before",
  "Експорт JSON": "Export JSON",
  "Експорт CSV": "Export CSV",
  "Експорт JSON підготовлено.": "JSON export is ready.",
  "Експорт CSV підготовлено.": "CSV export is ready.",
  "Видалити всі завдання": "Delete all tasks",
  "Немає завдань для видалення.": "There are no tasks to delete.",
  "Перемістити всі завдання ({n}) у кошик?": "Move all tasks ({n}) to the trash?",
  "Видалити всі завдання?": "Delete all tasks?",
  "Перемістити": "Move",
  "Усі завдання переміщено в кошик.": "All tasks were moved to the trash.",
  "Прогрес та інструменти": "Progress and tools",
  "Додаткові можливості робочого простору": "Extra workspace features",
  "Streak: {streak} дн. · Досягнення: {ach}/5 · Виконано: {done}": "Streak: {streak} d · Achievements: {ach}/5 · Completed: {done}",
  "Швидка нотатка": "Quick note",
  "Збережеться у цьому браузері": "Saved in this browser",
  "Запиши думку...": "Write down a thought...",
  "Зберегти нотатку": "Save note",
  "Мої нотатки": "My notes",
  "Спочатку введи текст нотатки.": "Type the note text first.",
  "Нотатку збережено.": "Note saved.",
  "Нотатку видалено.": "Note deleted.",
  "Нотаток поки немає.": "No notes yet.",
  "Видалити нотатку": "Delete note",
  "Кошик": "Trash",
  "Зберігання даних": "Data storage",
  "Завдання, категорії, профіль і налаштування синхронізуються через Cloud Firestore після входу. Тема та акцентний колір зберігаються локально.": "Tasks, categories, profile and settings are synced through Cloud Firestore after you sign in. Theme and accent color are stored locally.",
  "Створено для продуктивних днів": "Made for productive days",
  "Українську мову увімкнено.": "Українську мову увімкнено.",
  "English language enabled.": "English language enabled.",

  // ----- Форма завдання -----
  "Заповни основну інформацію, щоб не забути про важливу справу": "Fill in the basics so you don't forget something important",
  "Закрити": "Close",
  "Назва завдання": "Task title",
  "Наприклад: підготувати презентацію": "For example: prepare a presentation",
  "Опис": "Description",
  "Коротко опиши, що потрібно зробити...": "Briefly describe what needs to be done...",
  "Дедлайн": "Deadline",
  "Час": "Time",
  "Категорія": "Category",
  "Пріоритет": "Priority",
  "Низький": "Low",
  "Середній": "Medium",
  "Високий": "High",
  "Підзавдання": "Subtasks",
  "Кожен рядок — окремий пункт": "One item per line",
  "Прочитати матеріал\nЗробити конспект": "Read the material\nWrite a summary",
  "Повторюване завдання": "Recurring task",
  "Автоматично створювати наступне після виконання": "Automatically create the next one after completion",
  "Не повторювати": "Do not repeat",
  "Щодня": "Daily",
  "Щотижня": "Weekly",
  "Щомісяця": "Monthly",
  "Зберегти завдання": "Save task",
  "Зміни збережено.": "Changes saved.",
  "Нове завдання створено.": "New task created.",
  "Завдання виконано!": "Task completed!",
  "Завдання повернуто до плану.": "Task returned to the plan.",
  "Видалити завдання «{title}»?": "Delete the task “{title}”?",
  "Видалити завдання?": "Delete task?",
  "Завдання переміщено в кошик.": "Task moved to the trash.",
  "Увімкнути світлу тему": "Switch to light theme",
  "Увімкнути темну тему": "Switch to dark theme",

  // ----- Кошик і підтвердження -----
  "Видалені завдання можна відновити.": "Deleted tasks can be restored.",
  "Очистити кошик": "Empty trash",
  "Кошик порожній": "Trash is empty",
  "У кошику: {n} {tasks}. Їх можна відновити або видалити назавжди.": "The trash contains {n} {tasks}. You can restore them or delete them permanently.",
  "Кошик порожній. Видалені завдання з’являтимуться тут.": "The trash is empty. Deleted tasks will appear here.",
  "Без назви": "Untitled",
  "Видалено: {date}": "Deleted: {date}",
  "невідомо": "unknown",
  "Відновити": "Restore",
  "Видалити назавжди": "Delete permanently",
  "Завдання відновлено.": "Task restored.",
  "Це завдання буде видалено без можливості відновлення.": "This task will be deleted and cannot be recovered.",
  "Видалити назавжди?": "Delete permanently?",
  "Завдання остаточно видалено.": "Task permanently deleted.",
  "Кошик уже порожній.": "The trash is already empty.",
  "Остаточно видалити завдання з кошика ({n})?": "Permanently delete the tasks in the trash ({n})?",
  "Очистити кошик?": "Empty the trash?",
  "Кошик очищено.": "Trash emptied.",
  "Підтвердження дії": "Confirm action",
  "Ви впевнені, що хочете продовжити?": "Are you sure you want to continue?",
  "Підтвердити": "Confirm",

  // ----- Сповіщення -----
  "Непрочитаних: {n}": "Unread: {n}",
  "Завдання прострочене": "Task is overdue",
  "«{title}» не виконано. Перевір дедлайн.": "“{title}” is not completed. Check the deadline.",
  "До дедлайну менше години": "Less than an hour to the deadline",
  "До дедлайну менше 6 годин": "Less than 6 hours to the deadline",
  "До дедлайну менше 12 годин": "Less than 12 hours to the deadline",
  "Дедлайн сьогодні": "Deadline today",
  "Дедлайн завтра": "Deadline tomorrow",
  "Дедлайн через тиждень": "Deadline in a week",
  "Дедлайн через {n} дн.": "Deadline in {n} days",
  "Не забудь виконати завдання «{title}».": "Don't forget to complete “{title}”.",
  "Цей браузер не підтримує системні сповіщення.": "This browser does not support system notifications.",
  "Системні сповіщення увімкнено.": "System notifications enabled.",
  "Дозвіл на системні сповіщення не надано.": "Permission for system notifications was not granted.",

  // ----- Хмара -----
  "Не вдалося зберегти дані у хмарі. Перевір з'єднання.": "Could not save data to the cloud. Check your connection.",
  "Акаунт змінився. Увійди повторно.": "The account changed. Please sign in again.",
  "Втрачено зв’язок із хмарою. Локальні зміни залишаються у браузері; перевір інтернет.": "Lost connection to the cloud. Local changes stay in the browser; check your internet.",
  "Не вдалося підключитися до хмари. Перевір інтернет і Firebase Rules.": "Could not connect to the cloud. Check your internet and Firebase Rules.",

  // ----- Демонстраційні завдання -----
  "Підготувати матеріали до навчання": "Prepare study materials",
  "Переглянути конспект та повторити основні теми": "Review your notes and revise the main topics",
  "Попрацювати над власним проєктом": "Work on my own project",
  "Продовжити розробку інтерфейсу TaskFlow": "Continue developing the TaskFlow interface",
  "Скласти план на наступний тиждень": "Plan the next week",

  // ----- Експорт CSV -----
  "Назва": "Title",
  "Дата": "Date",
  "Статус": "Status"
};

// Форми множини: uk — [1, 2–4, 5+], en — [1, інше].
const TASKFLOW_PLURALS = {
  task: { uk: ["завдання", "завдання", "завдань"], en: ["task", "tasks"] },
  category: { uk: ["категорія", "категорії", "категорій"], en: ["category", "categories"] },
  taskShort: { uk: ["завд.", "завд.", "завд."], en: ["task", "tasks"] }
};

function getLanguage() { return currentLanguage; }
function getLocale() { return currentLanguage === "en" ? "en-US" : "uk-UA"; }

// Переклад рядка. Якщо перекладу немає, повертаємо ключ (українську).
function t(key, params) {
  let text = currentLanguage === "en" && Object.prototype.hasOwnProperty.call(TASKFLOW_EN, key)
    ? TASKFLOW_EN[key] : key;
  if (params) text = text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? params[name] : match));
  return text;
}

// Повертає правильну форму слова для числа: plural(5, "task") → «завдань» / "tasks".
function plural(count, key) {
  const forms = TASKFLOW_PLURALS[key]?.[currentLanguage] || TASKFLOW_PLURALS[key]?.uk || [key];
  if (currentLanguage === "en") return Math.abs(count) === 1 ? forms[0] : forms[1];
  const n = Math.abs(count) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

// Назви стандартних категорій перекладаємо лише для показу; користувацькі лишаються як є.
const DEFAULT_CATEGORY_NAMES = ["Навчання", "Робота", "Особисте", "Покупки", "Інше"];
function categoryLabel(name) {
  return DEFAULT_CATEGORY_NAMES.includes(name) ? t(name) : name;
}

// ----- Переклад статичного HTML -----
// Перед першим рендером запам'ятовуємо всі статичні текстові вузли й атрибути.
// Динамічні вузли (завдання, категорії тощо) сюди не потрапляють, тому користувацькі
// дані ніколи не перекладаються випадково.
const staticTextEntries = [];
const staticAttrEntries = [];
const TRANSLATABLE_ATTRS = ["placeholder", "aria-label", "title", "alt"];

function lookupStatic(original) {
  const trimmed = original.trim();
  if (!trimmed || !/[А-Яа-яІіЇїЄєҐґ]/.test(trimmed)) return null;
  const lead = original.slice(0, original.length - original.trimStart().length);
  const tail = original.slice(original.trimEnd().length);
  return { key: trimmed, lead, tail };
}

function registerStaticI18n() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const tag = node.parentElement?.tagName;
      return tag === "SCRIPT" || tag === "STYLE" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const info = lookupStatic(node.nodeValue);
    if (info) staticTextEntries.push({ node, original: node.nodeValue, info });
  }
  document.querySelectorAll("*").forEach(element => {
    TRANSLATABLE_ATTRS.forEach(attr => {
      if (!element.hasAttribute(attr)) return;
      const value = element.getAttribute(attr);
      const info = lookupStatic(value);
      if (info) staticAttrEntries.push({ element, attr, original: value, info });
    });
  });
}

function applyStaticTranslations() {
  staticTextEntries.forEach(entry => {
    entry.node.nodeValue = entry.info.lead + t(entry.info.key) + entry.info.tail;
  });
  staticAttrEntries.forEach(entry => {
    entry.element.setAttribute(entry.attr, entry.info.lead + t(entry.info.key) + entry.info.tail);
  });
  document.documentElement.lang = currentLanguage;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t("TaskFlow — простір для планування завдань і керування продуктивністю."));
}

function setLanguageState(language) {
  currentLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : "uk";
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage); } catch (error) { /* ігноруємо */ }
}
