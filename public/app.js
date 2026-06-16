const form = document.querySelector("#ticketForm");
const message = document.querySelector("#message");

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(window.I18N.t("message.submitting"));

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || window.I18N.t("message.submitFailed"));
    }

    form.reset();
    window.I18N.applyI18n();
    setMessage(window.I18N.t("message.submitSuccess", { id: data.id }), "success");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});
