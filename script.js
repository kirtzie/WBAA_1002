/* ============================================
   VASTRA — interactions
   ============================================ */

// ---- WhatsApp number (digits only, with country code, no + or spaces) ----
const WHATSAPP_NUMBER = "447823590526";

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Nav scroll state ----
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

// ---- Mobile menu ----
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");
burger.addEventListener("click", () => {
  const open = burger.classList.toggle("is-open");
  mobileMenu.classList.toggle("is-open", open);
});
mobileMenu.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    burger.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
  });
});

// ---- Ambient particles in hero ----
const particleField = document.getElementById("particles");
const PARTICLE_COUNT = 26;
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const p = document.createElement("span");
  p.style.left = Math.random() * 100 + "%";
  p.style.bottom = "-10px";
  const duration = 10 + Math.random() * 14;
  const delay = Math.random() * 14;
  const size = 1.5 + Math.random() * 2.5;
  p.style.width = size + "px";
  p.style.height = size + "px";
  p.style.animationDuration = duration + "s";
  p.style.animationDelay = "-" + delay + "s";
  particleField.appendChild(p);
}

// ---- 3D tilt: The Vitrine (hero signature element) ----
const vitrine = document.getElementById("vitrine");
const stage = document.querySelector(".hero__stage");
if (vitrine && stage && matchMedia("(pointer: fine)").matches) {
  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = 6 - x * 22;
    const rotX = 6 + y * 16;
    vitrine.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  stage.addEventListener("mouseleave", () => {
    vitrine.style.transform = "rotateX(6deg) rotateY(-10deg)";
  });
}

// ---- 3D tilt: collection cards ----
document.querySelectorAll("[data-tilt]").forEach((card) => {
  if (!matchMedia("(pointer: fine)").matches) return;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
  });
});

// ---- Scroll-reveal for sections ----
const revealTargets = document.querySelectorAll(".section, .card");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(24px)";
  el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  revealObserver.observe(el);
});
// Undo the reveal effect on the enquiry form's parent so the form itself stays put visually
// (kept subtle — only fade, no upward shift, for the enquire section head)

// ============================================
// FORM VALIDATION + WHATSAPP HANDOFF
// ============================================
const form = document.getElementById("enquiryForm");
const formNote = document.getElementById("formNote");

const fields = {
  fullName: {
    input: document.getElementById("fullName"),
    error: document.getElementById("err-fullName"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Please enter your name.";
      if (v.length < 2) return "Name looks too short.";
      if (!/^[a-zA-Z\s.'-]+$/.test(v)) return "Please use letters only.";
      return "";
    },
  },
  phone: {
    input: document.getElementById("phone"),
    error: document.getElementById("err-phone"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Please enter a phone number.";
      const digits = v.replace(/[^0-9]/g, "");
      if (digits.length < 10 || digits.length > 13) {
        return "Enter a valid number with country/area code.";
      }
      if (!/^[0-9+\s-]+$/.test(v)) return "Numbers, spaces and + only.";
      return "";
    },
  },
  message: {
    input: document.getElementById("message"),
    error: document.getElementById("err-message"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Tell us a little about what you need.";
      if (v.length < 10) return "A few more details would help (10+ characters).";
      return "";
    },
  },
};

function validateField(key) {
  const field = fields[key];
  const message = field.validate(field.input.value);
  field.error.textContent = message;
  field.input.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

Object.keys(fields).forEach((key) => {
  const field = fields[key];
  field.input.addEventListener("blur", () => validateField(key));
  field.input.addEventListener("input", () => {
    if (field.input.classList.contains("is-invalid")) validateField(key);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const results = Object.keys(fields).map((key) => validateField(key));
  const isValid = results.every(Boolean);

  if (!isValid) {
    formNote.textContent = "Please fix the fields marked in red.";
    formNote.style.color = "#E08A8A";
    return;
  }

  const name = fields.fullName.input.value.trim();
  const phone = fields.phone.input.value.trim();
  const occasion = document.getElementById("occasion").value;
  const message = fields.message.input.value.trim();

  const waMessage =
    `New enquiry from vastra site%0A` +
    `Name: ${name}%0A` +
    `Phone: ${phone}%0A` +
    `Occasion: ${occasion}%0A` +
    `Message: ${message}`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `New enquiry from VASTRA site\nName: ${name}\nPhone: ${phone}\nOccasion: ${occasion}\nMessage: ${message}`
  )}`;

  formNote.style.color = "";
  formNote.textContent = "Opening WhatsApp — send the message to reach us.";

  window.open(waUrl, "_blank", "noopener");

  form.reset();
  Object.values(fields).forEach((f) => {
    f.error.textContent = "";
    f.input.classList.remove("is-invalid");
  });
});
