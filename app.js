// Variables globales
let bible = null;
let currentBook = '';
let currentChapter = 1;
let favorites = [];
let notes = [];
let searchIndex = {};
let isDarkMode = false;
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
    loadSavedData(); // Primero cargamos los datos guardados
    await loadBible(); // Esperamos a que la Biblia se cargue
    showProverbOfDay();
    setupSearch();
    loadDarkModePreference();
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
        
        console.log('Biblia cargada correctamente');
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
        showToast('Error al cargar la Biblia. Por favor, recarga la página.');
        return false;
    }
}

// Cargar datos guardados
function loadSavedData() {
    console.log('Cargando datos guardados...');
    
    // Cargar favoritos
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
            console.log('Favoritos cargados:', favorites.length);
        } catch (e) {
            favorites = [];
            localStorage.setItem('favorites', '[]');
        }
    }

    // Cargar notas
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
            console.log('Notas cargadas:', notes.length);
        } catch (e) {
            notes = [];
            localStorage.setItem('notes', '[]');
        }
    }
    
    // Cargar modo oscuro
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
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

// Obtener el proverbio del día
function getProverbOfDay() {
    if (!bible || !bible['Proverbios']) return null;

    // Usar la fecha actual como semilla
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Obtener todos los proverbios disponibles
    const allProverbs = [];
    bible['Proverbios'].forEach((chapter, chapterIndex) => {
        chapter.forEach((verse, verseIndex) => {
            allProverbs.push({
                chapter: chapterIndex + 1,
                verse: verseIndex + 1,
                text: verse
            });
        });
    });

    // Usar la fecha como semilla para seleccionar un proverbio
    const index = seed % allProverbs.length;
    return allProverbs[index];
}

// Mostrar el proverbio del día
function showProverbOfDay() {
    const proverb = getProverbOfDay();
    if (!proverb) return;

    const proverbCard = document.getElementById('proverb-card');
    if (proverbCard) {
        proverbCard.innerHTML = `
            <div class="proverb-content">
                <div class="proverb-text">${proverb.text}</div>
                <div class="proverb-reference">Proverbios ${proverb.chapter}:${proverb.verse}</div>
            </div>
            <button onclick="goToProverb(${proverb.chapter}, ${proverb.verse})" class="read-more">
                <i class="material-icons">menu_book</i>
                Leer más
            </button>
            <div class="bible-title">
                Biblia de Poder y Milagros
            </div>
        `;
    }
}

// Ir al proverbio seleccionado
function goToProverb(chapter, verse) {
    currentBook = 'Proverbios';
    currentChapter = chapter;
    document.getElementById('bible-menu').style.display = 'block';
    document.getElementById('proverb-page').style.display = 'none';
    document.getElementById('chapter-page').style.display = 'block';
    document.getElementById('home-page').style.display = 'none';
    
    showChapter();
    
    // Esperar a que se cargue el capítulo y resaltar el versículo
    setTimeout(() => {
        const verseElement = document.querySelector(`.verse-container:nth-child(${verse})`);
        if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseElement.classList.add('highlighted');
            setTimeout(() => verseElement.classList.remove('highlighted'), 2000);
        }
    }, 100);
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
    console.log('Cargando datos guardados...');
    
    // Cargar favoritos
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
            console.log('Favoritos cargados:', favorites.length);
        } catch (e) {
            favorites = [];
            localStorage.setItem('favorites', '[]');
        }
    }

    // Cargar notas
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
            console.log('Notas cargadas:', notes.length);
        } catch (e) {
            notes = [];
            localStorage.setItem('notes', '[]');
        }
    }
    
    // Cargar modo oscuro
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Alternar modo oscuro
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    const darkModeIcon = document.querySelector('button[onclick="toggleDarkMode()"] i');
    if (darkModeIcon) {
        darkModeIcon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
    }
}

// Mostrar/ocultar notas
function toggleNotes() {
    const notesPanel = document.getElementById('notes-panel');
    notesPanel.classList.toggle('open');
    
    if (notesPanel.classList.contains('open')) {
        showNotes();
    }
}

// Mostrar notas
function showNotes() {
    console.log('Mostrando notas:', notes.length);
    const notesList = document.querySelector('.notes-list');
    if (!notesList) return;

    if (notes.length === 0) {
        notesList.innerHTML = '<p class="notes-empty">No tienes notas guardadas</p>';
        return;
    }

    notesList.innerHTML = notes.map((note, index) => `
        <div class="note-item">
            <div class="note-content">${note.text}</div>
            <div class="note-actions">
                <button onclick="deleteNote(${index})" class="delete-note" title="Eliminar nota">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        </div>
    `).join('');
}

// Guardar nota
function saveNote() {
    const textarea = document.querySelector('.add-note textarea');
    const text = textarea.value.trim();
    
    if (!text) {
        showToast('Por favor escribe una nota');
        return;
    }
    
    const note = {
        id: Date.now().toString(),
        text: text,
        date: new Date().toISOString()
    };
    
    notes.unshift(note); // Agregar al principio del array para que aparezca primero
    localStorage.setItem('notes', JSON.stringify(notes));
    console.log('Nota guardada. Total notas:', notes.length);
    
    textarea.value = '';
    showNotes();
    showToast('Nota guardada');
}

// Eliminar nota
function deleteNote(index) {
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    console.log('Nota eliminada. Total notas:', notes.length);
    showNotes();
    showToast('Nota eliminada');
}

// Mostrar/ocultar favoritos
function toggleFavorites() {
    const favoritesPanel = document.getElementById('favorites-panel');
    favoritesPanel.classList.toggle('open');
    
    if (favoritesPanel.classList.contains('open')) {
        showFavorites();
    }
}

// Mostrar favoritos
function showFavorites() {
    const favoritesList = document.querySelector('.favorites-list');
    if (!favoritesList) return;
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="favorites-empty">No tienes versículos favoritos guardados</p>';
        return;
    }

    favoritesList.innerHTML = favorites.map(fav => `
        <div class="favorite-item">
            <div class="favorite-content">
                <div class="favorite-text">${fav.text}</div>
                <div class="favorite-reference">
                    ${fav.book} ${fav.chapter}:${fav.verse}
                </div>
            </div>
            <div class="favorite-actions">
                <button onclick="goToVerse('${fav.book}', ${fav.chapter}, ${fav.verse})" class="go-to-verse" title="Ir al versículo">
                    <i class="material-icons">menu_book</i>
                </button>
                <button onclick="removeFavorite('${fav.id}')" class="remove-favorite" title="Eliminar de favoritos">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        </div>
    `).join('');
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
    if (button) {
        button.textContent = 'favorite';
        button.parentElement.classList.add('active');
    }
    
    // Actualizar la lista de favoritos si el panel está abierto
    const favoritesPanel = document.getElementById('favorites-panel');
    if (favoritesPanel.classList.contains('open')) {
        showFavorites();
    }
    
    showToast('Versículo agregado a favoritos');
}

// Eliminar de favoritos
function removeFavorite(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Actualizar la lista de favoritos
    showFavorites();
    
    // Actualizar el ícono si el versículo está visible
    const verse = favorites.find(fav => fav.id === id);
    if (verse && verse.book === currentBook && verse.chapter === currentChapter) {
        const button = document.querySelector(`.verse-container:nth-child(${verse.verse}) .favorite-button i`);
        if (button) {
            button.textContent = 'favorite_border';
            button.parentElement.classList.remove('active');
        }
    }
    
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
