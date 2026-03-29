const LOCAL_API_URL = 'https://securenote-backend-2qai.onrender.com/api/notes';
const POCKET_API_URL = 'https://app-tracking.pockethost.io/api/collections/notes/records';

// DOM Elements
const noteForm = document.getElementById('note-form');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const notesGrid = document.getElementById('notes-grid');
const loadingIndicator = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const noteCount = document.getElementById('note-count');
const tokenInput = document.getElementById('auth-token');
const toastContainer = document.getElementById('toast-container');


// State
let notes = [];
let currentApi = 'local'; // 'local' or 'pocket'

// Initialize
function init() {
    // If a token was saved previously in local session, load it automatically
    const savedToken = localStorage.getItem('securenote_token');
    if (savedToken) {
        tokenInput.value = savedToken;
    }

    // Save token as user types
    tokenInput.addEventListener('input', (e) => {
        localStorage.setItem('securenote_token', e.target.value);
    });

    // Tab integration
    const tabLocal = document.getElementById('tab-local');
    const tabPocket = document.getElementById('tab-pocket');

    if (tabLocal && tabPocket) {
        tabLocal.addEventListener('click', () => switchTab('local', tabLocal, tabPocket));
        tabPocket.addEventListener('click', () => switchTab('pocket', tabPocket, tabLocal));
    }

    noteForm.addEventListener('submit', handleAddNote);

    // Initial data fetch
    fetchNotes();
}

// Switch API Tab
function switchTab(apiType, activeElement, inactiveElement) {
    if (currentApi === apiType) return;
    
    currentApi = apiType;
    activeElement.classList.add('active');
    inactiveElement.classList.remove('active');
    
    // Clear and fetch new notes
    notes = [];
    renderNotes();
    fetchNotes();
}

// HTTP: Fetch notes
async function fetchNotes() {
    showLoading(true);
    try {
        const url = currentApi === 'local' ? LOCAL_API_URL : POCKET_API_URL;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const data = await response.json();
        
        if (currentApi === 'local') {
            notes = data;
        } else {
            // PocketBase maps response differently
            notes = (data.items || []).map(item => ({
                id: item.id,
                title: item.title,
                content: item.content,
                createdAt: item.created
            }));
        }
        
        renderNotes();
    } catch (error) {
        console.error('Error fetching notes:', error);
        showToast('warning', `Could not load notes from ${currentApi.toUpperCase()} API.`);
        renderNotes(); // Ensure empty state is shown
    } finally {
        showLoading(false);
    }
}

// HTTP: Add Note
async function handleAddNote(e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const token = tokenInput.value.trim();

    if (!title || !content) return;

    if (!token) {
        showToast('error', 'Authentication/ID Error: Please enter your Secret Token (or Student ID) at the top right.');
        tokenInput.focus();
        return;
    }

    try {
        const url = currentApi === 'local' ? LOCAL_API_URL : POCKET_API_URL;
        const headers = { 'Content-Type': 'application/json' };
        
        if (currentApi === 'local') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // For PocketHost, we pass the token as user_id and student_id just in case the API Rule requires it.
        const payload = currentApi === 'local' 
            ? { title, content } 
            : { title, content, user_id: Number(token) || token, student_id: token };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            throw new Error('401 Unauthorized Error.');
        } else if (!response.ok) {
            // Attempt to parse PocketBase specific validation errors
            let errText = `Error: ${response.statusText}`;
            try {
                const errData = await response.json();
                if (errData && errData.data) {
                    const messages = Object.keys(errData.data)
                        .map(key => `${key}: ${errData.data[key].message}`)
                        .join(', ');
                    if (messages) errText = `Validation Error -> ${messages}`;
                }
            } catch (e) {}
            throw new Error(errText);
        }

        const data = await response.json();
        
        const newNote = currentApi === 'local' ? data : {
            id: data.id,
            title: data.title,
            content: data.content,
            createdAt: data.created
        };

        notes.unshift(newNote); // Add to the top of our local state
        renderNotes();

        // Reset form
        titleInput.value = '';
        contentInput.value = '';
        showToast('success', 'Secure note successfully saved.');

    } catch (error) {
        showToast('error', error.message);
    }
}

// HTTP: Delete Note
async function deleteNote(id) {
    const token = tokenInput.value.trim();

    if (currentApi === 'local' && !token) {
        showToast('error', 'Authentication Error: Please enter your Secret Token to delete.');
        tokenInput.focus();
        return;
    }

    try {
        const url = currentApi === 'local' ? `${LOCAL_API_URL}/${id}` : `${POCKET_API_URL}/${id}`;
        const headers = {};
        
        if (currentApi === 'local') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'DELETE',
            headers
        });

        if (response.status === 401) {
            throw new Error('401 Unauthorized Error.');
        } else if (response.status === 404) {
            throw new Error('404 Not Found: The note could not be found or has already been deleted.');
        } else if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // Remove from DOM UI
        notes = notes.filter(n => n.id !== id);
        renderNotes();
        showToast('success', 'Note deleted permanently.');

    } catch (error) {
        showToast('error', error.message);
    }
}

// Vite uses type="module", so inline onclick handlers can only access global functions.
window.deleteNote = deleteNote;

// DOM Rendering
function renderNotes() {
    notesGrid.innerHTML = '';

    if (notes.length === 0) {
        emptyState.classList.remove('hidden');
        notesGrid.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        notesGrid.classList.remove('hidden');

        notes.forEach(note => {
            const dateStr = new Date(note.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-header">
                    <div class="note-title-wrapper">
                        <div class="note-title">${escapeHTML(note.title)}</div>
                        <div class="note-date">${dateStr}</div>
                    </div>
                    <button class="btn-delete" title="Delete Note" data-id="${note.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
                <div class="note-body">${escapeHTML(note.content)}</div>
            `;
            notesGrid.appendChild(card);
        });
    }

    noteCount.textContent = notes.length;
}

// Add event delegation for delete buttons
notesGrid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        deleteNote(id);
    }
});

// Helpers
function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        notesGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'error') {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'success') {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Add slide-in animation shortly after appending
    setTimeout(() => toast.classList.add('show'), 10);

    // Disappear after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Simple text escape for preventing XSS in displayed content
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Boot
document.addEventListener('DOMContentLoaded', init);
