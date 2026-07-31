const STORAGE_KEYS = {
    notes: "nova26-notes",
    schedule: "nova26-schedule",
    tasks: "nova26-tasks"
};

const DEFAULT_NOTES = [
    { id: 1, title: "Economics revision", subject: "Economics", content: "Focus on demand and supply curves before the test." },
    { id: 2, title: "Business studies case", subject: "Business Studies", content: "Review SWOT analysis and leadership styles." },
    { id: 3, title: "Python practice", subject: "Informatics Practices", content: "Practice loops, functions, and file handling." }
];

const DEFAULT_SCHEDULE = ["Revise math formulas", "Practice economics graphs", "Complete homework checklist"];
const DEFAULT_TASKS = [
    { title: "Finish maths revision", checked: true },
    { title: "Review economics notes", checked: false },
    { title: "Solve 5 practice questions", checked: false }
];

function getStored(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) {
            return fallback;
        }
        return JSON.parse(storedValue);
    } catch (error) {
        console.warn("Storage unavailable", error);
        return fallback;
    }
}

function saveStored(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getAuthToken() {
    return localStorage.getItem("nova26-token") || "";
}

async function apiRequest(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

function redirectTo(path) {
    window.location.href = path;
}

function openDashboard() {
    redirectTo("dashboard.html");
}

function openNotes() {
    redirectTo("notes.html");
}

function initSplash() {
    if (document.querySelector(".splash-container")) {
        const installBanner = document.getElementById("installBanner");
        const installBtn = document.getElementById("installBtn");
        let deferredPrompt = null;

        window.addEventListener("beforeinstallprompt", (event) => {
            event.preventDefault();
            deferredPrompt = event;
            installBanner?.removeAttribute("hidden");
        });

        installBtn?.addEventListener("click", async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBanner?.setAttribute("hidden", "true");
        });

        setTimeout(() => {
            redirectTo("login.html");
        }, 5000);
    }
}

function initLogin() {
    const loginBtn = document.getElementById("loginBtn");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const registerForm = document.getElementById("registerForm");
    if (!loginBtn) return;

    showRegisterBtn?.addEventListener("click", () => {
        const isHidden = registerForm?.hasAttribute("hidden");
        if (registerForm) {
            if (isHidden) {
                registerForm.removeAttribute("hidden");
                showRegisterBtn.textContent = "Hide form";
            } else {
                registerForm.setAttribute("hidden", "true");
                showRegisterBtn.textContent = "Create account";
            }
        }
    });

    loginBtn.addEventListener("click", async () => {
        const username = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();

        if (!username || !password) {
            alert("Please enter your username and password.");
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = "Signing in...";
            const result = await apiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password })
            });
            localStorage.setItem("nova26-token", result.user.token);
            localStorage.setItem("nova26-user", JSON.stringify(result.user));
            localStorage.setItem("nova26-profile", JSON.stringify(result.data));
            openDashboard();
        } catch (error) {
            alert(error.message || "Login failed");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
        }
    });

    registerForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
            name: document.getElementById("registerName").value.trim(),
            username: document.getElementById("registerUsername").value.trim().toLowerCase(),
            password: document.getElementById("registerPassword").value
        };

        if (!payload.name || !payload.username || !payload.password) {
            alert("Please complete all fields to create an account.");
            return;
        }

        try {
            const result = await apiRequest("/api/register", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            localStorage.setItem("nova26-token", result.user.token);
            localStorage.setItem("nova26-user", JSON.stringify(result.user));
            localStorage.setItem("nova26-profile", JSON.stringify(result.data));
            alert(`Account created for ${result.user.username}. You can log in with your username and password.`);
            openDashboard();
        } catch (error) {
            alert(error.message || "Registration failed");
        }
    });
}

function initDashboard() {
    const taskList = document.getElementById("taskList");
    const progressLabel = document.getElementById("progressLabel");
    const dailyProgress = document.getElementById("dailyProgress");
    const focusSummary = document.getElementById("focusSummary");
    const scheduleList = document.getElementById("scheduleList");
    const scheduleForm = document.getElementById("scheduleForm");
    const scheduleInput = document.getElementById("scheduleInput");
    const subjectTabs = document.getElementById("subjectTabs");
    const noteList = document.getElementById("noteList");
    const resetDataBtn = document.getElementById("resetDataBtn");
    const calcDisplay = document.getElementById("calcDisplay");
    const assistantForm = document.getElementById("assistantForm");
    const assistantInput = document.getElementById("assistantInput");
    const assistantChat = document.getElementById("assistantChat");
    const careerForm = document.getElementById("careerForm");
    const careerResult = document.getElementById("careerResult");
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".content-section");
    const dashboardSearch = document.getElementById("dashboardSearch");
    const dashboardSubjectTabs = document.getElementById("dashboardSubjectTabs");
    const dashboardNotesList = document.getElementById("dashboardNotesList");
    const dashboardNoteForm = document.getElementById("dashboardNoteForm");
    const dashboardNoteTitle = document.getElementById("dashboardNoteTitle");
    const dashboardNoteSubject = document.getElementById("dashboardNoteSubject");
    const dashboardNoteContent = document.getElementById("dashboardNoteContent");
    const profileName = document.getElementById("profileName");
    const profileMeta = document.getElementById("profileMeta");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileNotesCount = document.getElementById("profileNotesCount");
    const profileInsight = document.getElementById("profileInsight");

    const subjects = ["All", "Informatics Practices", "Economics", "Business Studies", "Accountancy", "English"];
    let selectedSubject = "All";
    let dashboardSelectedSubject = "All";
    let dashboardSearchValue = "";
    let tasks = getStored(STORAGE_KEYS.tasks, DEFAULT_TASKS);
    let schedule = getStored(STORAGE_KEYS.schedule, DEFAULT_SCHEDULE);
    let notes = getStored(STORAGE_KEYS.notes, DEFAULT_NOTES);

    function updateProfileCard(user) {
        if (!profileName || !profileMeta || !profileAvatar || !profileNotesCount || !profileInsight) return;

        const safeUser = user || JSON.parse(localStorage.getItem("nova26-user") || "null") || {};
        const displayName = safeUser.name || "Student";
        const className = safeUser.class_name || "Class";
        const board = safeUser.board || "Board";
        const subject = safeUser.subject || "Subject";
        const initials = displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "ST";

        profileName.textContent = displayName;
        profileMeta.textContent = `${className} • ${board} • ${subject}`;
        profileAvatar.textContent = initials;
        profileNotesCount.textContent = String(notes.length);
        profileInsight.textContent = `You are building strong habits in ${subject}. Keep your next session focused on one goal and one clear revision block.`;
    }

    async function syncProfile() {
        try {
            const profile = await apiRequest("/api/profile");
            if (profile.user) {
                localStorage.setItem("nova26-user", JSON.stringify(profile.user));
            }
            if (profile.data) {
                const payload = profile.data;
                if (payload.notes) notes = payload.notes;
                if (payload.schedule) schedule = payload.schedule;
                if (payload.tasks) tasks = payload.tasks;
                saveStored(STORAGE_KEYS.notes, notes);
                saveStored(STORAGE_KEYS.schedule, schedule);
                saveStored(STORAGE_KEYS.tasks, tasks);
            }
            updateProfileCard(profile.user || JSON.parse(localStorage.getItem("nova26-user") || "null"));
        } catch (error) {
            console.warn("Profile sync failed", error);
            updateProfileCard();
        }
    }

    async function persistProfile() {
        try {
            await apiRequest("/api/profile", {
                method: "POST",
                body: JSON.stringify({ data: { notes, schedule, tasks } })
            });
        } catch (error) {
            console.warn("Profile save failed", error);
        }
    }

    function renderTasks() {
        if (!taskList) return;
        const completed = tasks.filter((task) => task.checked).length;
        const percent = Math.round((completed / tasks.length) * 100);
        taskList.innerHTML = tasks.map((task, index) => `
            <li class="task-item ${task.checked ? "done" : ""}">
                <label>
                    <input type="checkbox" data-index="${index}" ${task.checked ? "checked" : ""}>
                    <span>${task.title}</span>
                </label>
            </li>
        `).join("");
        if (progressLabel) progressLabel.textContent = `${percent}% complete`;
        if (dailyProgress) dailyProgress.style.width = `${percent}%`;
        if (focusSummary) {
            focusSummary.textContent = completed >= 2
                ? "You are building a strong rhythm. Keep it up and finish the remaining practice questions."
                : "A short revision block will help you recover momentum before the next class.";
        }
    }

    taskList?.addEventListener("change", async (event) => {
        if (event.target.matches("input[type='checkbox']")) {
            const index = Number(event.target.dataset.index);
            tasks[index].checked = event.target.checked;
            saveStored(STORAGE_KEYS.tasks, tasks);
            renderTasks();
            await persistProfile();
        }
    });

    function renderSchedule() {
        if (!scheduleList) return;
        scheduleList.innerHTML = schedule.map((item, index) => `
            <li class="schedule-item">
                <span>${item}</span>
                <button type="button" data-index="${index}" class="delete-btn small">×</button>
            </li>
        `).join("");
    }

    scheduleForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const value = scheduleInput.value.trim();
        if (!value) return;
        schedule.unshift(value);
        saveStored(STORAGE_KEYS.schedule, schedule);
        scheduleInput.value = "";
        renderSchedule();
        await persistProfile();
    });

    scheduleList?.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-index]");
        if (!button) return;
        const index = Number(button.dataset.index);
        schedule.splice(index, 1);
        saveStored(STORAGE_KEYS.schedule, schedule);
        renderSchedule();
        await persistProfile();
    });

    function renderNotes() {
        if (!noteList || !subjectTabs) return;
        subjectTabs.innerHTML = subjects.map((subject) => `
            <button type="button" class="subject-chip ${selectedSubject === subject ? "active" : ""}" data-subject="${subject}">
                ${subject}
            </button>
        `).join("");

        const visibleNotes = notes.filter((note) => selectedSubject === "All" || note.subject === selectedSubject);
        noteList.innerHTML = visibleNotes.length
            ? visibleNotes.map((note) => `
                <article class="mini-note">
                    <div class="mini-note-top">
                        <h4>${note.title}</h4>
                        <span>${note.subject}</span>
                    </div>
                    <p>${note.content}</p>
                </article>
            `).join("")
            : '<p class="empty-state">No notes yet for this subject.</p>';
    }

    subjectTabs?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-subject]");
        if (!button) return;
        selectedSubject = button.dataset.subject;
        renderNotes();
    });

    function handleCalculator() {
        if (!calcDisplay) return;
        const buttons = document.querySelectorAll(".calc-btn");
        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const value = button.dataset.value;
                if (value === undefined) return;
                if (calcDisplay.value === "0" && value !== ".") {
                    calcDisplay.value = value;
                } else {
                    calcDisplay.value += value;
                }
            });
        });

        document.getElementById("calcEqual")?.addEventListener("click", () => {
            try {
                const safeExpression = calcDisplay.value.replace(/×/g, "*").replace(/−/g, "-");
                calcDisplay.value = Function(`"use strict"; return (${safeExpression})`)();
            } catch (error) {
                calcDisplay.value = "Error";
            }
        });

        document.getElementById("calcClear")?.addEventListener("click", () => {
            calcDisplay.value = "0";
        });

        document.getElementById("calcBack")?.addEventListener("click", () => {
            calcDisplay.value = calcDisplay.value.length > 1 ? calcDisplay.value.slice(0, -1) : "0";
        });
    }

    function getAiReply(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes("career") || lowerPrompt.includes("job") || lowerPrompt.includes("course") || lowerPrompt.includes("future")) {
            return "Based on your current learning style, a strong path is to combine practical skills with one focused career direction. For example, if you like logic and problem solving, explore software, data, or finance-related paths while building one portfolio project.";
        }
        if (lowerPrompt.includes("math") || lowerPrompt.includes("equation")) {
            return "Break the problem into steps: identify the formula, substitute values carefully, simplify, and check your answer. I can also help you create a short practice set for this topic.";
        }
        if (lowerPrompt.includes("schedule") || lowerPrompt.includes("plan") || lowerPrompt.includes("week")) {
            return "Use a 3-part cycle: 50 minutes deep study, 10 minutes review, and 5 minutes recap. For the next week, focus on your weakest topic first and end with one practice test.";
        }
        if (lowerPrompt.includes("improve") || lowerPrompt.includes("improvement") || lowerPrompt.includes("exam")) {
            return "For faster improvement, revise your weak topics daily, solve 10 mixed questions, and keep a small error log so you can spot patterns quickly.";
        }
        return "You are doing well. I can help with explanations, revision plans, career advice, course suggestions, productivity habits, or step-by-step problem solving for any subject.";
    }

    function appendMessage(role, message) {
        if (!assistantChat) return;
        const bubble = document.createElement("div");
        bubble.className = `assistant-message ${role}`;
        bubble.innerHTML = `<strong>${role === "user" ? "You" : "Nova"}</strong><p>${message}</p>`;
        assistantChat.appendChild(bubble);
        assistantChat.scrollTop = assistantChat.scrollHeight;
    }

    assistantForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const prompt = assistantInput?.value.trim();
        if (!prompt) return;
        appendMessage("user", prompt);
        assistantInput.value = "";
        appendMessage("assistant", getAiReply(prompt));
    });

    document.querySelectorAll(".suggestion-pill").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt;
            if (!prompt) return;
            appendMessage("user", prompt);
            appendMessage("assistant", getAiReply(prompt));
        });
    });

    careerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const interest = document.getElementById("interestSelect").value;
        const path = document.getElementById("pathSelect").value;
        const adviceMap = {
            technology: {
                job: "A fast route is to learn one practical skill such as web development, app building, or data analysis and create a small portfolio project.",
                course: "A good course direction is a short diploma or certificate in software development, programming, or digital marketing.",
                skill: "Focus on one skill at a time: Python, web design, or problem solving, and practice it every day for 30 minutes."
            },
            business: {
                job: "Start with communication, finance, and business analysis skills. A beginner internship or small project can help you get hired faster.",
                course: "Choose a business, accounting, management, or economics-related course that fits your interests and career goals.",
                skill: "Build skills in presentation, research, spreadsheets, and planning to stand out in business roles."
            },
            design: {
                job: "Develop your visual storytelling, UI design, and creative tools. Build a few polished design samples to show your ability.",
                course: "A design course in UI/UX, graphics, or digital media would be a strong next step for you.",
                skill: "Practice layouts, color theory, and user experience principles every week to improve quickly."
            }
        };
        careerResult.textContent = adviceMap[interest][path];
    });

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.target;
            navButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
            sections.forEach((section) => section.classList.toggle("active", section.id === target));
        });
    });

    function renderDashboardNotes() {
        if (!dashboardSubjectTabs || !dashboardNotesList) return;
        dashboardSubjectTabs.innerHTML = subjects.map((subject) => `
            <button type="button" class="subject-chip ${dashboardSelectedSubject === subject ? "active" : ""}" data-subject="${subject}">
                ${subject}
            </button>
        `).join("");

        const visibleNotes = notes.filter((note) => {
            const matchesSubject = dashboardSelectedSubject === "All" || note.subject === dashboardSelectedSubject;
            const matchesSearch = note.title.toLowerCase().includes(dashboardSearchValue.toLowerCase()) || note.content.toLowerCase().includes(dashboardSearchValue.toLowerCase());
            return matchesSubject && matchesSearch;
        });

        dashboardNotesList.innerHTML = visibleNotes.length
            ? visibleNotes.map((note) => `
                <article class="note-card">
                    <div class="mini-note-top">
                        <h3>${note.title}</h3>
                        <span>${note.subject}</span>
                    </div>
                    <p>${note.content}</p>
                    <button class="delete-btn" data-id="${note.id}">Delete</button>
                </article>
            `).join("")
            : '<p class="empty-state">No notes match your search yet.</p>';
    }

    dashboardSubjectTabs?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-subject]");
        if (!button) return;
        dashboardSelectedSubject = button.dataset.subject;
        renderDashboardNotes();
    });

    dashboardSearch?.addEventListener("input", (event) => {
        dashboardSearchValue = event.target.value;
        renderDashboardNotes();
    });

    dashboardNoteForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = dashboardNoteTitle.value.trim();
        const content = dashboardNoteContent.value.trim();
        if (!title || !content) return;
        notes.unshift({
            id: Date.now(),
            title,
            subject: dashboardNoteSubject.value,
            content
        });
        saveStored(STORAGE_KEYS.notes, notes);
        dashboardNoteForm.reset();
        renderDashboardNotes();
        await persistProfile();
    });

    dashboardNotesList?.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-id]");
        if (!button) return;
        notes = notes.filter((note) => note.id !== Number(button.dataset.id));
        saveStored(STORAGE_KEYS.notes, notes);
        renderDashboardNotes();
        await persistProfile();
    });

    resetDataBtn?.addEventListener("click", async () => {
        saveStored(STORAGE_KEYS.notes, DEFAULT_NOTES);
        saveStored(STORAGE_KEYS.schedule, DEFAULT_SCHEDULE);
        saveStored(STORAGE_KEYS.tasks, DEFAULT_TASKS);
        notes = DEFAULT_NOTES;
        schedule = DEFAULT_SCHEDULE;
        tasks = DEFAULT_TASKS;
        renderTasks();
        renderSchedule();
        renderNotes();
        await persistProfile();
        alert("Saved data has been restored.");
    });

    updateProfileCard(JSON.parse(localStorage.getItem("nova26-user") || "null"));
    renderTasks();
    renderSchedule();
    renderNotes();
    renderDashboardNotes();
    handleCalculator();
    syncProfile();
}

function initNotesPage() {
    const searchNote = document.getElementById("searchNote");
    const subjectTabs = document.getElementById("subjectTabs");
    const noteForm = document.getElementById("noteForm");
    const noteTitle = document.getElementById("noteTitle");
    const noteSubject = document.getElementById("noteSubject");
    const noteContent = document.getElementById("noteContent");
    const notesContainer = document.getElementById("notesContainer");

    const subjects = ["All", "Informatics Practices", "Economics", "Business Studies", "Accountancy", "English"];
    let selectedSubject = "All";
    let searchTerm = "";
    let notes = getStored(STORAGE_KEYS.notes, DEFAULT_NOTES);

    function renderNotes() {
        if (!notesContainer || !subjectTabs) return;
        subjectTabs.innerHTML = subjects.map((subject) => `
            <button type="button" class="subject-chip ${selectedSubject === subject ? "active" : ""}" data-subject="${subject}">
                ${subject}
            </button>
        `).join("");

        const visibleNotes = notes.filter((note) => {
            const matchesSubject = selectedSubject === "All" || note.subject === selectedSubject;
            const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || note.content.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSubject && matchesSearch;
        });

        notesContainer.innerHTML = visibleNotes.length
            ? visibleNotes.map((note) => `
                <article class="note-card">
                    <div class="mini-note-top">
                        <h3>${note.title}</h3>
                        <span>${note.subject}</span>
                    </div>
                    <p>${note.content}</p>
                    <button class="delete-btn" data-id="${note.id}">Delete</button>
                </article>
            `).join("")
            : '<p class="empty-state">No notes match your search yet.</p>';
    }

    subjectTabs?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-subject]");
        if (!button) return;
        selectedSubject = button.dataset.subject;
        renderNotes();
    });

    searchNote?.addEventListener("input", (event) => {
        searchTerm = event.target.value;
        renderNotes();
    });

    noteForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        if (!title || !content) return;
        notes.unshift({
            id: Date.now(),
            title,
            subject: noteSubject.value,
            content
        });
        saveStored(STORAGE_KEYS.notes, notes);
        noteForm.reset();
        renderNotes();
    });

    notesContainer?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-id]");
        if (!button) return;
        notes = notes.filter((note) => note.id !== Number(button.dataset.id));
        saveStored(STORAGE_KEYS.notes, notes);
        renderNotes();
    });

    renderNotes();
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("SW registration failed", error));
        });
    }
}

function initApp() {
    registerServiceWorker();
    initSplash();
    initLogin();

    const path = window.location.pathname;
    if (path.includes("dashboard.html")) {
        initDashboard();
    }
    if (path.includes("notes.html")) {
        initNotesPage();
    }
}

initApp();