// Variables globales
let bible = null;
let currentBook = '';
let currentChapter = 1;
let favorites = [];
let notes = [];
let searchIndex = {};
let bibleStructure = {
    antiguoTestamento: [
        'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
        'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
        '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
        'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
        'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones',
        'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
        'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc',
        'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'
    ],
    nuevoTestamento: [
        'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
        'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
        'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo',
        '2 Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago',
        '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan',
        'Judas', 'Apocalipsis'
    ]
};

// Inicializar la aplicación
async function initializeApp() {
    console.log('Iniciando la aplicación...');
    await loadBible();
    showProverbOfDay();
    setupSearch();
    loadDarkModePreference();
    loadSavedData();
}

// Cargar la Biblia
async function loadBible() {
    try {
        console.log('Intentando cargar la Biblia...');
        const response = await fetch('bible-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Biblia cargada, procesando datos...');
        
        bible = {};
        for (const [book, chapters] of Object.entries(data)) {
            const normalizedBook = normalizeBookName(book);
            bible[normalizedBook] = chapters.map(chapter => 
                chapter.map(verse => verse.replace(/\/n/g, ' ').trim())
            );
        }
        
        return true;
    } catch (error) {
        console.error('Error al cargar la Biblia:', error);
        document.getElementById('proverb-card').innerHTML = `
            <div class="error-message">
                <p>Error al cargar la Biblia: ${error.message}</p>
                <button onclick="initializeApp()" class="retry-button">
                    <i class="material-icons">refresh</i>
                    Recargar página
                </button>
            </div>
        `;
        return false;
    }
}

// Mostrar/ocultar buscador
function toggleSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchInput = searchBar.querySelector('input');
    
    if (searchBar.style.display === 'none') {
        searchBar.style.display = 'flex';
        searchInput.focus();
    } else {
        searchBar.style.display = 'none';
        searchInput.value = '';
        document.getElementById('home-page').style.display = 'block';
        document.getElementById('chapter-page').style.display = 'none';
    }
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            document.getElementById('home-page').style.display = 'block';
            document.getElementById('chapter-page').style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            const results = searchBible(query);
            showSearchResults(results);
        }, 300);
    });
}

// Mostrar testamento
function showTestament(testament) {
    const antiguoTestamento = document.getElementById('antiguoTestamento');
    const nuevoTestamento = document.getElementById('nuevoTestamento');
    
    // Mostrar la página principal si está oculta
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('chapter-page').style.display = 'none';
    
    // Ocultar ambos testamentos
    antiguoTestamento.style.display = 'none';
    nuevoTestamento.style.display = 'none';
    
    // Mostrar el testamento seleccionado
    const selectedTestament = document.getElementById(testament);
    if (selectedTestament.style.display === 'none') {
        selectedTestament.style.display = 'grid';
        displayBooks(testament);
    } else {
        selectedTestament.style.display = 'none';
    }
}

// Mostrar libros
function displayBooks(testament) {
    if (!bible) return;
    
    const container = document.getElementById(testament);
    const books = bibleStructure[testament];
    
    container.innerHTML = books
        .map(book => `
            <button onclick="selectBook('${book}')" class="book-button">
                ${book}
            </button>
        `).join('');
}

// Seleccionar un libro
function selectBook(book) {
    currentBook = book;
    currentChapter = 1;
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('chapter-page').style.display = 'block';
    showChapter();
}

// Mostrar un capítulo
function showChapter() {
    const titleElement = document.querySelector('.chapter-title');
    const contentElement = document.querySelector('.chapter-content');
    
    if (!bible || !bible[currentBook] || !bible[currentBook][currentChapter - 1]) {
        contentElement.innerHTML = '<p>Capítulo no encontrado</p>';
        return;
    }

    titleElement.textContent = `${currentBook} ${currentChapter}`;
    const verses = bible[currentBook][currentChapter - 1];
    const totalChapters = bible[currentBook].length;
    
    contentElement.innerHTML = `
        <div class="verses">
            ${verses.map((verse, index) => `
                <div class="verse-container">
                    <span class="verse-number">${index + 1}</span>
                    <span class="verse-text">${verse}</span>
                    <button onclick="addToFavorites(${index + 1}, '${verse.replace(/'/g, "\\'")}')" class="favorite-button">
                        <i class="material-icons">${isFavorite(currentBook, currentChapter, index + 1) ? 'favorite' : 'favorite_border'}</i>
                    </button>
                </div>
            `).join('')}
        </div>
        <div class="chapter-navigation">
            ${currentChapter > 1 ? `
                <button onclick="changeChapter(-1)">
                    <i class="material-icons">chevron_left</i>
                    <span>Anterior</span>
                </button>` : '<div></div>'}
            
            <div class="chapter-selector">
                <select onchange="selectChapter(this.value)">
                    ${Array.from({length: totalChapters}, (_, i) => i + 1)
                        .map(num => `<option value="${num}" ${num === currentChapter ? 'selected' : ''}>
                            Capítulo ${num}
                        </option>`).join('')}
                </select>
            </div>

            ${currentChapter < totalChapters ? `
                <button onclick="changeChapter(1)">
                    <span>Siguiente</span>
                    <i class="material-icons">chevron_right</i>
                </button>` : '<div></div>'}
        </div>
    `;
}

// Seleccionar capítulo
function selectChapter(chapter) {
    currentChapter = parseInt(chapter);
    showChapter();
}

// Buscar en la Biblia
function searchBible(query) {
    const results = [];
    for (const [book, chapters] of Object.entries(bible)) {
        chapters.forEach((verses, chapterIndex) => {
            verses.forEach((verse, verseIndex) => {
                if (verse.toLowerCase().includes(query)) {
                    results.push({
                        book,
                        chapter: chapterIndex + 1,
                        verse: verseIndex + 1,
                        text: verse
                    });
                }
            });
        });
    }
    return results;
}

// Mostrar resultados de búsqueda
function showSearchResults(results) {
    const contentElement = document.querySelector('.chapter-content');
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('chapter-page').style.display = 'block';
    
    if (results.length === 0) {
        contentElement.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
        return;
    }

    contentElement.innerHTML = `
        <div class="search-results">
            ${results.map(result => `
                <div class="verse-container search-result" onclick="goToVerse('${result.book}', ${result.chapter}, ${result.verse})">
                    <div class="reference">${result.book} ${result.chapter}:${result.verse}</div>
                    <div class="verse-text">${result.text}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Ir a un versículo específico
function goToVerse(book, chapter, verse) {
    currentBook = book;
    currentChapter = chapter;
    showChapter();
    
    setTimeout(() => {
        const verseElement = document.querySelector(`.verse-container:nth-child(${verse})`);
        if (verseElement) {
            verseElement.classList.add('highlighted');
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => verseElement.classList.remove('highlighted'), 2000);
        }
    }, 100);
}

// Mostrar proverbio del día
function showProverbOfDay() {
    if (!bible || !bible['Proverbios']) return;
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    const chapter = (dayOfMonth % 31) + 1;
    const verses = bible['Proverbios'][chapter - 1];
    
    if (!verses) return;
    
    const randomVerseNum = Math.floor(Math.random() * verses.length);
    const verse = verses[randomVerseNum];
    
    const proverbCard = document.getElementById('proverb-card');
    proverbCard.innerHTML = `
        <div class="reference">Proverbios ${chapter}:${randomVerseNum + 1}</div>
        <div class="verse">${verse}</div>
    `;
    
    proverbCard.onclick = () => {
        currentBook = 'Proverbios';
        currentChapter = chapter;
        document.getElementById('proverb-page').style.display = 'none';
        document.getElementById('bible-menu').style.display = 'block';
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('chapter-page').style.display = 'block';
        showChapter();
    };
}

// Mostrar el menú de la Biblia
function showBibleMenu() {
    document.getElementById('proverb-page').style.display = 'none';
    document.getElementById('bible-menu').style.display = 'block';
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('chapter-page').style.display = 'none';
}

// Mostrar página principal
function showHomePage() {
    document.getElementById('proverb-page').style.display = 'flex';
    document.getElementById('bible-menu').style.display = 'none';
    showProverbOfDay();
}

// Normalizar nombres de libros
function normalizeBookName(book) {
    const normalizations = {
        'Genesis': 'Génesis',
        'Exodo': 'Éxodo',
        'Levitico': 'Levítico',
        'Numeros': 'Números',
        'Deuteronomio': 'Deuteronomio',
        'Josue': 'Josué',
        'Nehemias': 'Nehemías',
        'Eclesiastes': 'Eclesiastés',
        'Isaias': 'Isaías',
        'Jeremias': 'Jeremías',
        'Amos': 'Amós',
        'Abdias': 'Abdías',
        'Jonas': 'Jonás',
        'Nahum': 'Nahúm',
        'Sofonias': 'Sofonías',
        'Zacarias': 'Zacarías',
        'Malaquias': 'Malaquías',
        'Galatas': 'Gálatas',
        'Filemon': 'Filemón'
    };
    return normalizations[book] || book;
}

// Cambiar de capítulo
function changeChapter(delta) {
    const newChapter = currentChapter + delta;
    if (newChapter >= 1 && newChapter <= bible[currentBook].length) {
        currentChapter = newChapter;
        showChapter();
    }
}

// Cargar datos guardados
function loadSavedData() {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
    
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
        const isDarkMode = JSON.parse(savedDarkMode);
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

// Alternar modo oscuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    // Actualizar el ícono del botón
    const darkModeIcon = document.querySelector('button[onclick="toggleDarkMode()"] i');
    darkModeIcon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
}

// Funciones de notas
function toggleNotes() {
    const notesPanel = document.getElementById('notes-panel');
    notesPanel.classList.toggle('open');
    if (notesPanel.classList.contains('open')) {
        showNotes();
    }
}

function showNotes() {
    const notesList = document.querySelector('.notes-list');
    notesList.innerHTML = notes.map((note, index) => `
        <div class="note-item">
            <div class="note-header">
                <span>${note.date}</span>
                <button onclick="deleteNote(${index})" class="delete-note">
                    <i class="material-icons">delete</i>
                </button>
            </div>
            <div class="note-text">${note.text}</div>
            <div class="note-reference">${note.reference || ''}</div>
        </div>
    `).join('') || '<p class="notes-empty">No tienes notas guardadas</p>';
}

function saveNote() {
    const textarea = document.querySelector('.add-note textarea');
    const text = textarea.value.trim();
    
    if (text) {
        const note = {
            text,
            date: new Date().toLocaleDateString(),
            reference: `${currentBook} ${currentChapter}`
        };
        
        notes.unshift(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        textarea.value = '';
        showNotes();
        showToast('Nota guardada');
    }
}

function deleteNote(index) {
    if (confirm('¿Deseas eliminar esta nota?')) {
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        showNotes();
        showToast('Nota eliminada');
    }
}

// Mostrar favoritos
function showFavorites() {
    const favoritesList = document.querySelector('.favorites-list');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = favorites.length ? favorites.map(fav => `
        <div class="favorite-item">
            <div class="favorite-text">${fav.text}</div>
            <div class="favorite-reference">${fav.book} ${fav.chapter}:${fav.verse}</div>
            <button onclick="removeFavorite('${fav.id}')" class="remove-favorite">
                <i class="material-icons">delete</i>
            </button>
        </div>
    `).join('') : '<p class="favorites-empty">No tienes versículos favoritos guardados</p>';
}

// Agregar a favoritos
function addToFavorites(verseNumber, verseText) {
    const favorite = {
        id: Date.now().toString(),
        book: currentBook,
        chapter: currentChapter,
        verse: verseNumber,
        text: verseText
    };
    
    favorites.push(favorite);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Actualizar el ícono del botón
    const button = document.querySelector(`.verse-container:nth-child(${verseNumber}) .favorite-button i`);
    button.textContent = 'favorite';
    button.parentElement.classList.add('active');
    
    showToast('Versículo agregado a favoritos');
}

// Eliminar de favoritos
function removeFavorite(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showFavorites();
    showToast('Versículo eliminado de favoritos');
}

// Comprobar si un versículo es favorito
function isFavorite(book, chapter, verse) {
    return favorites.some(fav => fav.book === book && fav.chapter === chapter && fav.verse === verse);
}

// Mostrar mensaje toast
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

// Inicializar la aplicación
initializeApp();
