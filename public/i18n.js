const TRANSLATIONS = {
  "zh-CN": {
    "title.home": "IT 需求反馈",
    "title.admin": "IT 反馈后台",
    "nav.admin": "管理员入口",
    "nav.back": "返回提交页",
    "language.toggle": "繁體",
    "home.eyebrow": "IT Feedback",
    "home.heading": "IT 需求反馈",
    "home.copy": "有软件开发、维护或其他系统相关需求，请在这里提交。IT 收到后会按优先级处理。",
    "admin.eyebrow": "Admin",
    "admin.heading": "IT 反馈后台",
    "admin.copy": "输入管理员密码后查看全部软件需求反馈。",
    "field.category": "需求类型",
    "field.priority": "优先级",
    "field.task": "任务",
    "field.requester": "反馈人",
    "field.description": "描述",
    "field.adminPassword": "管理员密码",
    "required": "*",
    "category.development": "开发",
    "category.maintenance": "维护",
    "category.other": "其他",
    "priority.critical": "极高",
    "priority.medium": "中等",
    "priority.low": "较低",
    "placeholder.task": "例如：新增销售报表导出功能",
    "placeholder.requester": "填写你的名字",
    "placeholder.description": "选填：补充需求背景、期望效果、相关页面或具体例子",
    "placeholder.adminPassword": "输入管理员密码",
    "button.submit": "提交反馈",
    "button.load": "查看全部需求",
    "button.delete": "完成并删除",
    "progress.label": "任务进度",
    "message.submitting": "正在提交...",
    "message.submitFailed": "提交失败，请稍后再试",
    "message.submitSuccess": "提交成功，需求编号：#{id}",
    "message.passwordRequired": "请输入管理员密码",
    "message.loading": "正在加载...",
    "message.loadFailed": "加载失败",
    "message.loaded": "已加载 {count} 条反馈",
    "message.noTickets": "暂时没有符合条件的反馈。",
    "message.noDescription": "没有填写详细描述。",
    "message.deleting": "正在删除...",
    "message.deleteFailed": "删除失败",
    "message.deleted": "#{id} 已删除",
    "message.savingProgress": "正在保存进度...",
    "message.progressSaved": "#{id} 进度已更新为 {progress}%",
    "message.progressSaveFailed": "保存进度失败",
    "confirm.delete": "确认删除这条需求吗？\n\n#{id} {title}",
    "meta.createdAt": "提交时间"
  },
  "zh-TW": {
    "title.home": "IT 需求反饋",
    "title.admin": "IT 反饋後台",
    "nav.admin": "管理員入口",
    "nav.back": "返回提交頁",
    "language.toggle": "简体",
    "home.eyebrow": "IT Feedback",
    "home.heading": "IT 需求反饋",
    "home.copy": "有軟體開發、維護或其他系統相關需求，請在這裡提交。IT 收到後會按優先級處理。",
    "admin.eyebrow": "Admin",
    "admin.heading": "IT 反饋後台",
    "admin.copy": "輸入管理員密碼後查看全部軟體需求反饋。",
    "field.category": "需求類型",
    "field.priority": "優先級",
    "field.task": "任務",
    "field.requester": "反饋人",
    "field.description": "描述",
    "field.adminPassword": "管理員密碼",
    "required": "*",
    "category.development": "開發",
    "category.maintenance": "維護",
    "category.other": "其他",
    "priority.critical": "極高",
    "priority.medium": "中等",
    "priority.low": "較低",
    "placeholder.task": "例如：新增銷售報表匯出功能",
    "placeholder.requester": "填寫你的名字",
    "placeholder.description": "選填：補充需求背景、期望效果、相關頁面或具體例子",
    "placeholder.adminPassword": "輸入管理員密碼",
    "button.submit": "提交反饋",
    "button.load": "查看全部需求",
    "button.delete": "完成並刪除",
    "progress.label": "任務進度",
    "message.submitting": "正在提交...",
    "message.submitFailed": "提交失敗，請稍後再試",
    "message.submitSuccess": "提交成功，需求編號：#{id}",
    "message.passwordRequired": "請輸入管理員密碼",
    "message.loading": "正在載入...",
    "message.loadFailed": "載入失敗",
    "message.loaded": "已載入 {count} 條反饋",
    "message.noTickets": "暫時沒有符合條件的反饋。",
    "message.noDescription": "沒有填寫詳細描述。",
    "message.deleting": "正在刪除...",
    "message.deleteFailed": "刪除失敗",
    "message.deleted": "#{id} 已刪除",
    "message.savingProgress": "正在儲存進度...",
    "message.progressSaved": "#{id} 進度已更新為 {progress}%",
    "message.progressSaveFailed": "儲存進度失敗",
    "confirm.delete": "確認刪除這條需求嗎？\n\n#{id} {title}",
    "meta.createdAt": "提交時間"
  }
};

const STORAGE_KEY = "preferredLanguage";
const DEFAULT_LOCALE = "zh-CN";

function getLocale() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return Object.prototype.hasOwnProperty.call(TRANSLATIONS, saved) ? saved : DEFAULT_LOCALE;
}

function t(key, values = {}) {
  const locale = getLocale();
  const template = TRANSLATIONS[locale][key] || TRANSLATIONS[DEFAULT_LOCALE][key] || key;

  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}

function applyI18n() {
  const locale = getLocale();
  const page = document.body.dataset.page;
  document.documentElement.lang = locale;

  if (page) {
    document.title = t(`title.${page}`);
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
}

function toggleLocale() {
  const nextLocale = getLocale() === "zh-CN" ? "zh-TW" : "zh-CN";
  localStorage.setItem(STORAGE_KEY, nextLocale);
  applyI18n();
  window.dispatchEvent(new CustomEvent("languagechange"));
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();

  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    button.addEventListener("click", toggleLocale);
  });
});

window.I18N = {
  applyI18n,
  getLocale,
  t,
  toggleLocale
};
