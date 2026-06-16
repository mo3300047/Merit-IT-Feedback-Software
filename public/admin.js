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

function renderTickets(tickets) {
  currentTickets = tickets;

  if (!tickets.length) {
    ticketsContainer.innerHTML = `<p class="empty">${window.I18N.t("message.noTickets")}</p>`;
    return;
  }

  ticketsContainer.innerHTML = tickets.map((ticket) => `
    <article class="ticket" data-id="${ticket.id}">
      <div class="ticket-header">
        <div>
          <p class="ticket-id">#${ticket.id}</p>
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
  const title = ticketElement.querySelector("h2").textContent;

  if (!confirm(window.I18N.t("confirm.delete", { id, title }))) {
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

    setMessage(window.I18N.t("message.deleted", { id }), "success");
    await loadTickets();
  } catch (error) {
    setMessage(error.message, "error");
    button.disabled = false;
  }
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadTickets();
  }
});
