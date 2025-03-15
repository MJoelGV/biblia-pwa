// Variables globales
let bible = null;
let currentBook = 'Proverbios';
let currentChapter = 1;
let favorites = JSON.parse(localStorage.getItem('bibleFavorites') || '[]');
let searchIndex = {};

// Estructura de la Biblia
const bibleStructure = {
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
    
    // Agregar evento de clic para ir al capítulo completo
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
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('chapter-page').style.display = 'block';
    displayBooks();
}

// Mostrar página principal
function showHomePage() {
    document.getElementById('proverb-page').style.display = 'flex';
    document.getElementById('bible-menu').style.display = 'none';
    showProverbOfDay();
}

// Mostrar libros
function displayBooks() {
    if (!bible) {
        console.error('La Biblia no está cargada');
        return;
    }

    const oldTestament = document.getElementById('antiguoTestamento');
    const newTestament = document.getElementById('nuevoTestamento');
    
    oldTestament.innerHTML = bibleStructure.antiguoTestamento
        .map(book => `
            <button onclick="selectBook('${book}')" class="book-button">
                ${book}
            </button>
        `).join('');
    
    newTestament.innerHTML = bibleStructure.nuevoTestamento
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
    
    contentElement.innerHTML = `
        <div class="verses">
            ${verses.map((verse, index) => `
                <div class="verse-container">
                    <span class="verse-number">${index + 1}</span>
                    <span class="verse-text">${verse}</span>
                </div>
            `).join('')}
        </div>
        <div class="chapter-navigation">
            ${currentChapter > 1 ? `<button onclick="changeChapter(-1)"><i class="material-icons">chevron_left</i>Anterior</button>` : ''}
            ${currentChapter < bible[currentBook].length ? `<button onclick="changeChapter(1)">Siguiente<i class="material-icons">chevron_right</i></button>` : ''}
        </div>
    `;
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

// Inicializar la aplicación
initializeApp();
