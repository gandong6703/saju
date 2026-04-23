const form = document.getElementById("saju-form");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const birthDate = String(formData.get("birthDate") ?? "").trim();

    if (!birthDate) {
      return;
    }

    const params = new URLSearchParams();

    const name = String(formData.get("name") ?? "").trim();
    const hanjaName = String(formData.get("hanjaName") ?? "").trim();
    const gender = String(formData.get("gender") ?? "male");
    const calendarType = String(formData.get("calendar_type") ?? "solar");
    const timeBranch = String(formData.get("timeBranch") ?? "unknown");

    if (name) {
      params.set("name", name);
    }
    if (hanjaName) {
      params.set("hanjaName", hanjaName);
    }

    params.set("birthDate", birthDate);
    params.set("gender", gender);
    params.set("calendarType", calendarType);
    params.set("timeBranch", timeBranch);

    window.location.href = `/result.html?${params.toString()}`;
  });
}
