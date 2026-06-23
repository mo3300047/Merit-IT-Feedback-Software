const CATEGORY_LABELS = {
  development: "category.development",
  maintenance: "category.maintenance",
  other: "category.other"
};

const PRIORITY_LABELS = {
  critical: "priority.critical",
  medium: "priority.medium",
  low: "priority.low"
};

const passwordInput = document.querySelector("#password");
const loadButton = document.querySelector("#loadTickets");
const message = document.querySelector("#adminMessage");
const ticketsContainer = document.querySelector("#tickets");
let currentTickets = [];

passwordInput.value = localStorage.getItem("adminPassword") || "";

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(`${value.replace(" ", "T")}Z`).toLocaleString("zh-CN", {
    hour12: false
  });
}

function getPassword() {
  const password = passwordInput.value.trim();
  if (password) {
    localStorage.setItem("adminPassword", password);
  }
  return password;
}

function labelFromMap(map, value) {
  return map[value] ? window.I18N.t(map[value]) : value;
}

function normalizeProgress(value) {
  const progress = Number(value);
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(progress)));
}

function getTicketSortTime(ticket) {
  if (!ticket.created_at) {
    return 0;
  }

  return new Date(`${ticket.created_at.replace(" ", "T")}Z`).getTime();
}

function sortTicketsNewestFirst(tickets) {
  return [...tickets].sort((a, b) => {
    const timeDifference = getTicketSortTime(b) - getTicketSortTime(a);
    if (timeDifference !== 0) {
      return timeDifference;
    }

    return Number(b.id) - Number(a.id);
  });
}

function renderTickets(tickets) {
  const sortedTickets = sortTicketsNewestFirst(tickets);
  currentTickets = sortedTickets;

  if (!sortedTickets.length) {
    ticketsContainer.innerHTML = `<p class="empty">${window.I18N.t("message.noTickets")}</p>`;
    return;
  }

  ticketsContainer.innerHTML = sortedTickets.map((ticket, index) => `
    <article class="ticket" data-id="${ticket.id}" data-progress="${normalizeProgress(ticket.progress)}">
      <div class="ticket-header">
        <div>
          <p class="ticket-id">#${sortedTickets.length - index}</p>
          <h2>${escapeHtml(ticket.title)}</h2>
        </div>
        <span class="badge ${ticket.priority}">${labelFromMap(PRIORITY_LABELS, ticket.priority)}</span>
      </div>

      <dl class="meta">
        <div><dt>${window.I18N.t("field.category")}</dt><dd>${labelFromMap(CATEGORY_LABELS, ticket.category)}</dd></div>
        <div><dt>${window.I18N.t("field.requester")}</dt><dd>${escapeHtml(ticket.requester_name)}</dd></div>
        <div><dt>${window.I18N.t("field.priority")}</dt><dd>${labelFromMap(PRIORITY_LABELS, ticket.priority)}</dd></div>
        <div><dt>${window.I18N.t("meta.createdAt")}</dt><dd>${formatDate(ticket.created_at)}</dd></div>
      </dl>

      <p class="description">${ticket.description ? escapeHtml(ticket.description) : window.I18N.t("message.noDescription")}</p>
      <div class="ticket-actions">
        <label class="progress-control">
          <span class="progress-label">
            <span>${window.I18N.t("progress.label")}</span>
            <output>${normalizeProgress(ticket.progress)}%</output>
          </span>
          <input class="progress-range" type="range" min="0" max="100" step="5" value="${normalizeProgress(ticket.progress)}">
        </label>
        <button class="delete-ticket" type="button">${window.I18N.t("button.delete")}</button>
      </div>
    </article>
  `).join("");
}

async function loadTickets() {
  const password = getPassword();
  if (!password) {
    setMessage(window.I18N.t("message.passwordRequired"), "error");
    return;
  }

  setMessage(window.I18N.t("message.loading"));
  loadButton.disabled = true;

  try {
    const response = await fetch("/api/tickets", {
      headers: {
        "x-admin-password": password
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || window.I18N.t("message.loadFailed"));
    }

    renderTickets(data.tickets);
    setMessage(window.I18N.t("message.loaded", { count: data.tickets.length }), "success");
  } catch (error) {
    ticketsContainer.innerHTML = "";
    setMessage(error.message, "error");
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadTickets);
window.addEventListener("languagechange", () => {
  if (currentTickets.length || ticketsContainer.innerHTML) {
    renderTickets(currentTickets);
  }
});

ticketsContainer.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-ticket");
  if (!button) {
    return;
  }

  const ticketElement = button.closest(".ticket");
  const id = ticketElement.dataset.id;
  const displayNumber = ticketElement.querySelector(".ticket-id").textContent.replace("#", "");
  const title = ticketElement.querySelector("h2").textContent;

  if (!confirm(window.I18N.t("confirm.delete", { id: displayNumber, title }))) {
    return;
  }

  button.disabled = true;
  setMessage(window.I18N.t("message.deleting"));

  try {
    const response = await fetch(`/api/tickets/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-password": getPassword()
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || window.I18N.t("message.deleteFailed"));
    }

    setMessage(window.I18N.t("message.deleted", { id: displayNumber }), "success");
    await loadTickets();
  } catch (error) {
    setMessage(error.message, "error");
    button.disabled = false;
  }
});

ticketsContainer.addEventListener("input", (event) => {
  const range = event.target.closest(".progress-range");
  if (!range) {
    return;
  }

  const ticketElement = range.closest(".ticket");
  ticketElement.querySelector(".progress-label output").textContent = `${range.value}%`;
});

ticketsContainer.addEventListener("change", async (event) => {
  const range = event.target.closest(".progress-range");
  if (!range) {
    return;
  }

  const ticketElement = range.closest(".ticket");
  const id = ticketElement.dataset.id;
  const previousProgress = normalizeProgress(ticketElement.dataset.progress);
  const progress = normalizeProgress(range.value);

  range.disabled = true;
  setMessage(window.I18N.t("message.savingProgress"));

  try {
    const response = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": getPassword()
      },
      body: JSON.stringify({ progress })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || window.I18N.t("message.progressSaveFailed"));
    }

    ticketElement.dataset.progress = data.progress;
    const ticket = currentTickets.find((item) => String(item.id) === String(id));
    if (ticket) {
      ticket.progress = data.progress;
    }
    const displayNumber = ticketElement.querySelector(".ticket-id").textContent.replace("#", "");
    setMessage(window.I18N.t("message.progressSaved", { id: displayNumber, progress: data.progress }), "success");
  } catch (error) {
    range.value = previousProgress;
    ticketElement.querySelector(".progress-label output").textContent = `${previousProgress}%`;
    setMessage(error.message, "error");
  } finally {
    range.disabled = false;
  }
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadTickets();
  }
});
