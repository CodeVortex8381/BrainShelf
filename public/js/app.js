/**
 * BrainShelf Homepage Application Logic
 * Fetches approved notes from API, manages search, combined category & semester filters,
 * loading, empty, error, and retry states.
 */

const notesGrid = document.getElementById("notesGrid");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const emptyMessage = document.getElementById("emptyMessage");
const filters = document.getElementById("filters");
const semesterFilter = document.getElementById("semesterFilter");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const notesLoadingState = document.getElementById("notesLoadingState");
const notesErrorState = document.getElementById("notesErrorState");
const notesErrorMessage = document.getElementById("notesErrorMessage");
const retryNotesBtn = document.getElementById("retryNotesBtn");

let activeCategory = "All";
let activeSemester = "All";
let currentSearchQuery = "";
let fetchController = null;

const CATEGORY_ICONS = {
  Programming: "⌘",
  Database: "▤",
  AI: "✳",
  "Web Development": "◇",
  Other: "✦",
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || "✦";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "";
  }
}

async function fetchNotes() {
  if (fetchController) {
    fetchController.abort();
  }
  fetchController = new AbortController();

  if (notesLoadingState) notesLoadingState.hidden = false;
  if (notesErrorState) notesErrorState.hidden = true;
  if (emptyMessage) emptyMessage.hidden = true;
  if (notesGrid) notesGrid.innerHTML = "";

  const params = new URLSearchParams();
  if (activeCategory && activeCategory !== "All") {
    params.set("category", activeCategory);
  }
  if (activeSemester && activeSemester !== "All") {
    params.set("semester", activeSemester);
  }
  if (currentSearchQuery) {
    params.set("search", currentSearchQuery);
  }

  try {
    const response = await fetch(`/api/notes?${params.toString()}`, {
      signal: fetchController.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (notesLoadingState) notesLoadingState.hidden = true;

    if (data.success && Array.isArray(data.notes)) {
      renderNotesGrid(data.notes);
    } else {
      throw new Error(data.error || "Unable to load notes.");
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Error fetching notes:", error);
    if (notesLoadingState) notesLoadingState.hidden = true;
    if (notesErrorState) {
      notesErrorState.hidden = false;
      if (notesErrorMessage) {
        notesErrorMessage.textContent = "Unable to connect to the notes repository. Please try again.";
      }
    }
  }
}

function renderNotesGrid(notes) {
  if (!notesGrid) return;

  if (notes.length === 0) {
    notesGrid.innerHTML = "";
    if (emptyMessage) emptyMessage.hidden = false;
    return;
  }

  if (emptyMessage) emptyMessage.hidden = true;

  notesGrid.innerHTML = notes
    .map((note) => {
      const icon = getCategoryIcon(note.category);
      const title = escapeHtml(note.title);
      const subject = escapeHtml(note.subject || note.category);
      const category = escapeHtml(note.category);
      const semester = escapeHtml(note.semester);
      const description = escapeHtml(note.description);
      const formattedDate = formatDate(note.createdAt);
      const noteId = note._id;
      const downloadUrl = `/api/notes/${noteId}/download`;

      return `
        <article class="note-card">
            <div class="note-icon">${icon}</div>
            <span class="note-category">${category}</span>
            <h3>${title}</h3>
            <p>${description}</p>
            <div class="note-meta">
                <span>${semester}</span>
                <strong>${subject}</strong>
            </div>
            <div class="note-actions">
                <span class="note-date">${formattedDate ? `📅 ${formattedDate}` : ""}</span>
                <a href="${downloadUrl}" class="btn-download-card" download>
                    📥 View / Download
                </a>
            </div>
        </article>
      `;
    })
    .join("");
}

// Search form submit
if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    currentSearchQuery = searchInput ? searchInput.value.trim() : "";
    fetchNotes();
    const notesEl = document.getElementById("notes");
    if (notesEl) {
      notesEl.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// Real-time search with debounce
let debounceTimeout = null;
if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      currentSearchQuery = searchInput.value.trim();
      fetchNotes();
    }, 250);
  });
}

// Category filter buttons
if (filters) {
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;

    activeCategory = button.dataset.category;

    filters.querySelectorAll(".filter").forEach((filter) => {
      filter.classList.toggle("active", filter === button);
    });

    fetchNotes();
  });
}

// Semester select filter
if (semesterFilter) {
  semesterFilter.addEventListener("change", (event) => {
    activeSemester = event.target.value;
    fetchNotes();
  });
}

// Reset filters button
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    activeCategory = "All";
    activeSemester = "All";
    currentSearchQuery = "";

    if (searchInput) searchInput.value = "";
    if (semesterFilter) semesterFilter.value = "All";

    if (filters) {
      filters.querySelectorAll(".filter").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.category === "All");
      });
    }

    fetchNotes();
  });
}

// Retry button
if (retryNotesBtn) {
  retryNotesBtn.addEventListener("click", () => {
    fetchNotes();
  });
}

// Initial fetch on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchNotes();
});
