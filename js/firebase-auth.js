// Firebase Authentication для TaskFlow.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, EmailAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
  linkWithCredential, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAE7TdDQnvs-SZ-1UlD7OTYBcBdboAwpxs",
  authDomain: "taskflow-ab433.firebaseapp.com",
  projectId: "taskflow-ab433",
  storageBucket: "taskflow-ab433.firebasestorage.app",
  messagingSenderId: "429543200026",
  appId: "1:429543200026:web:74a44ff5eecaf1250888a3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const $ = (selector) => document.querySelector(selector);
let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  $("#auth-title").textContent = t(registering ? "Створити акаунт" : "Увійти в TaskFlow");
  $("#auth-subtitle").textContent = t(registering ? "Зареєструйся за допомогою пошти або Google." : "Увійди, щоб відкрити свій профіль TaskFlow.");
  $("#auth-name").hidden = !registering;
  $("#auth-name-label").hidden = !registering;
  $("#auth-name").required = registering;
  $("#auth-password").autocomplete = registering ? "new-password" : "current-password";
  $("#auth-submit").textContent = t(registering ? "Зареєструватися" : "Увійти");
  $("#auth-mode-login").classList.toggle("active", !registering);
  $("#auth-mode-register").classList.toggle("active", registering);
  $("#auth-error").hidden = true;
}

// Повідомлення про помилки перекладаються під час показу (t() залежить від поточної мови).
function authError(error) {
  const messages = {
    "auth/email-already-in-use": "Ця пошта вже зареєстрована або прив’язана до іншого акаунта.",
    "auth/invalid-email": "Введи коректну електронну адресу.",
    "auth/weak-password": "Пароль має містити щонайменше 6 символів.",
    "auth/invalid-credential": "Неправильна пошта або пароль.",
    "auth/user-not-found": "Неправильна пошта або пароль.",
    "auth/wrong-password": "Неправильна пошта або пароль.",
    "auth/popup-closed-by-user": "Вікно Google закрито до завершення входу.",
    "auth/unauthorized-domain": "Додай цей домен до дозволених доменів Firebase Authentication.",
    "auth/operation-not-allowed": "Цей спосіб входу ще не ввімкнено у Firebase Console.",
    "auth/credential-already-in-use": "Ці дані вже використовуються іншим акаунтом Firebase.",
    "auth/provider-already-linked": "Email і пароль уже прив’язані до цього акаунта.",
    "auth/requires-recent-login": "Потрібно повторно увійти через Google, а потім спробувати ще раз.",
    "auth/invalid-password": "Перевір пароль. Він має містити щонайменше 6 символів.",
    "auth/too-many-requests": "Забагато спроб. Спробуй трохи пізніше.",
    "auth/network-request-failed": "Немає з'єднання з інтернетом."
  };
  return t(messages[error.code] || "Не вдалося виконати дію. Перевір налаштування Firebase та з'єднання.");
}

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const name = $("#auth-name").value.trim();
  const error = $("#auth-error");
  const button = $("#auth-submit");
  error.hidden = true;
  button.disabled = true;
  button.textContent = t("Зачекай...");
  try {
    if (authMode === "register") {
      if (!name) throw new Error(t("Вкажи ім'я для реєстрації."));
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    error.textContent = err.code ? authError(err) : err.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = t(authMode === "register" ? "Зареєструватися" : "Увійти");
  }
});

$("#google-sign-in").addEventListener("click", async () => {
  const error = $("#auth-error");
  error.hidden = true;
  try { await signInWithPopup(auth, googleProvider); }
  catch (err) { error.textContent = authError(err); error.hidden = false; }
});

// Прив’язуємо email і новий пароль до вже авторизованого Google-акаунта.
const linkEmailForm = $("#link-email-form");
const linkEmailInput = $("#link-email");
const linkPasswordInput = $("#link-password");
const linkEmailStatus = $("#link-email-status");

function updateLinkedAccountUI(user) {
  if (!linkEmailForm || !linkEmailStatus) return;

  const providers = user?.providerData?.map(provider => provider.providerId) || [];
  const hasGoogle = providers.includes("google.com");
  const hasPassword = providers.includes("password");

  linkEmailForm.hidden = !user || !hasGoogle || hasPassword;

  if (user && hasPassword) {
    linkEmailStatus.textContent = t("Email і пароль уже прив’язані до цього акаунта.");
    linkEmailStatus.hidden = false;
  } else if (user && hasGoogle) {
    linkEmailStatus.textContent = t("Встанови пароль, щоб надалі входити також через email.");
    linkEmailStatus.hidden = false;
    linkEmailInput.value = user.email || "";
  } else {
    linkEmailStatus.hidden = true;
  }
}

linkEmailForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const email = linkEmailInput.value.trim();
  const password = linkPasswordInput.value;
  const button = $("#link-email-submit");

  button.disabled = true;
  button.textContent = t("Прив’язуємо...");

  try {
    // Створюємо облікові дані email/пароль і додаємо їх до поточного Google-акаунта.
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(user, credential);

    linkPasswordInput.value = "";
    updateLinkedAccountUI(result.user);
    linkEmailStatus.textContent = t("Email і пароль успішно прив’язані до твого Google-акаунта.");
    linkEmailStatus.hidden = false;
  } catch (error) {
    linkEmailStatus.textContent = authError(error);
    linkEmailStatus.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = t("Прив’язати email і пароль");
  }
});

$("#auth-mode-login").addEventListener("click", () => setAuthMode("login"));
$("#auth-mode-register").addEventListener("click", () => setAuthMode("register"));
$("#sign-out-button").addEventListener("click", async () => {
  try { await signOut(auth); window.showToast?.(t("Ти вийшов з акаунта.")); }
  catch (err) { $("#auth-error").textContent = authError(err); $("#auth-error").hidden = false; }
});

// Після зміни мови оновлюємо тексти форми входу та статус прив'язки акаунта.
document.addEventListener("taskflow-language", () => {
  setAuthMode(authMode);
  updateLinkedAccountUI(auth.currentUser);
});

onAuthStateChanged(auth, (user) => {
  $("#auth-panel").hidden = Boolean(user);
  $("#profile-layout").hidden = !user;
  window.applyFirebaseProfile?.(user);
  updateLinkedAccountUI(user);
  if (window.lucide) window.lucide.createIcons();
});
