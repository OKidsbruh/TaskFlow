// ==============================
// TASKFLOW — REALTIME CLOUD FIRESTORE
// ==============================
import { app, auth } from "./firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const db = getFirestore(app);
let unsubscribeSnapshot = null;
let activeUid = null;
let writeQueue = Promise.resolve();
const getUserDocument = uid => doc(db, "users", uid, "workspace", "main");

// Firestore не приймає undefined у даних — прибираємо такі поля перед записом.
const sanitize = data => JSON.parse(JSON.stringify(data));

function clearPreviousAccountData() {
  // Видаляємо локальні дані попереднього акаунта, щоб вони не миготіли в інтерфейсі.
  ["taskflow-tasks","taskflow-categories","taskflow-pomodoro-data","taskflow-pomodoro-settings",
   "taskflow-notifications","taskflow-profile","taskflow-user","taskflow-trash",
   "taskflow-quick-notes","taskflow-extra-settings"].forEach(key => localStorage.removeItem(key));
  window.location.reload();
}

async function loadOrCreateDocument(user) {
  const ref = getUserDocument(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Перший вхід: переносимо в хмару те, що вже є в браузері (завдання, категорії тощо),
    // щоб після реєстрації нічого не зникло.
    const local = sanitize(window.getTaskFlowCloudData?.() || {});
    const initialData = {
      tasks: local.tasks || [],
      categories: local.categories || [],
      pomodoroData: local.pomodoroData || { sessions: [], minuteLogs: [] },
      pomodoroSettings: local.pomodoroSettings || { focus: 25, short: 5, long: 15 },
      notifications: local.notifications || [],
      extraSettings: local.extraSettings || {},
      taskTrash: local.taskTrash || [],
      quickNotes: local.quickNotes || [],
      profile: {
        name: user.displayName || t("Користувач"),
        about: local.profile?.about || "",
        avatar: user.photoURL || local.profile?.avatar || ""
      },
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    await setDoc(ref, initialData);
  }
}

async function saveCloudData(data) {
  const user = auth.currentUser;
  if (!user || user.uid !== activeUid) throw new Error(t("Акаунт змінився. Увійди повторно."));
  const ref = getUserDocument(user.uid);
  // Послідовна черга не дозволяє паралельним записам перезаписувати новіші дані.
  // catch: після однієї невдалої спроби черга не повинна блокувати всі наступні записи.
  writeQueue = writeQueue.catch(() => {}).then(() => setDoc(ref, { ...sanitize(data), updatedAt: serverTimestamp() }, { merge: true }));
  return writeQueue;
}
window.taskFlowCloud = { saveCloudData };
window.taskFlowCloudReady = false;

onAuthStateChanged(auth, async user => {
  window.taskFlowCloudReady = false;
  if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
  if (!user) {
    const hadAccount = Boolean(activeUid);
    activeUid = null;
    if (hadAccount) {
      clearPreviousAccountData();
      return;
    }
    console.info("TaskFlow: користувач не авторизований.");
    return;
  }
  if (activeUid && activeUid !== user.uid) {
    activeUid = user.uid;
    clearPreviousAccountData();
    return;
  }
  activeUid = user.uid;
  try {
    await loadOrCreateDocument(user);
    const ref = getUserDocument(user.uid);
    unsubscribeSnapshot = onSnapshot(ref, snapshot => {
      if (!snapshot.exists() || auth.currentUser?.uid !== user.uid) return;
      window.applyTaskFlowCloudData?.(snapshot.data());
      window.taskFlowCloudReady = true;
      if (window.taskFlowPendingCloudSave) {
        window.taskFlowPendingCloudSave = false;
        window.taskFlowCloud.saveCloudData(window.getTaskFlowCloudData()).catch(error => {
          console.error("Не вдалося прибрати початкові завдання з хмари:", error);
        });
      }
    }, error => {
      console.error("Firestore listener:", error);
      window.showToast?.(t("Втрачено зв’язок із хмарою. Локальні зміни залишаються у браузері; перевір інтернет."));
    });
  } catch (error) {
    console.error("TaskFlow Firestore:", error);
    window.showToast?.(t("Не вдалося підключитися до хмари. Перевір інтернет і Firebase Rules."));
  }
});
