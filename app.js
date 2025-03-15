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

// Variables globales
let bible = null;
let currentBook = 'Génesis';
let currentChapter = 1;
let favorites = JSON.parse(localStorage.getItem('bibleFavorites') || '[]');
let searchIndex = {};

// Inicializar la aplicación
async function initializeApp() {
    console.log('Iniciando la aplicación...');
    await loadBible();
    displayBooks();
    showHomePage();
}

// Cargar la Biblia
async function loadBible() {
    try {
        console.log('Intentando cargar la Biblia...');
        const response = await fetch('bible-data.json');
        console.log('Estado de la respuesta:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Biblia cargada, procesando datos...');
        
        // Normalizar nombres de libros
        bible = {};
        for (const [book, chapters] of Object.entries(data)) {
            const normalizedBook = normalizeBookName(book);
            bible[normalizedBook] = chapters;
        }
        
        console.log('Libros disponibles:', Object.keys(bible));
        return true;
    } catch (error) {
        console.error('Error al cargar la Biblia:', error);
        document.querySelector('.chapter-content').innerHTML = `
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

// Mostrar página principal
function showHomePage() {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('chapter-page').style.display = 'none';
    displayBooks();
    showProverbOfDay();
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
    
    const proverbHtml = `
        <div class="proverb-of-day">
            <div class="reference">Proverbios ${chapter}:${randomVerseNum + 1}</div>
            <div class="verse">${verse}</div>
        </div>
    `;
    
    const homeContent = document.querySelector('.testament-grid');
    homeContent.insertAdjacentHTML('beforebegin', proverbHtml);
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
    displayChapter(book, currentChapter);
}

// Normalizar nombres de libros
function normalizeBookName(book) {
    const normalizations = {
        'Genesis': 'Génesis',
        'Exodo': 'Éxodo',
        'Levitico': 'Levítico',
        'Numeros': 'Números',
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

// Mostrar un capítulo
function displayChapter(book, chapter) {
    const content = document.querySelector('.chapter-content');
    if (!bible || !bible[book] || !bible[book][chapter - 1]) {
        content.innerHTML = '<p>Capítulo no encontrado</p>';
        return;
    }

    const verses = bible[book][chapter - 1];
    content.innerHTML = `
        <h2>${book} ${chapter}</h2>
        <div class="verses">
            ${verses.map((verse, index) => {
                const verseNum = index + 1;
                return `
                    <p>
                        <span class="verse-number">${verseNum}</span>
                        ${verse}
                    </p>
                `;
            }).join('')}
        </div>
        <div class="chapter-navigation">
            ${chapter > 1 ? `<button onclick="navigateChapter(-1)"><i class="material-icons">chevron_left</i>Anterior</button>` : ''}
            ${chapter < bible[book].length ? `<button onclick="navigateChapter(1)">Siguiente<i class="material-icons">chevron_right</i></button>` : ''}
        </div>
    `;
}

// Navegar entre capítulos
function navigateChapter(delta) {
    const newChapter = currentChapter + delta;
    if (newChapter >= 1 && newChapter <= bible[currentBook].length) {
        currentChapter = newChapter;
        displayChapter(currentBook, currentChapter);
    }
}

// Inicializar la aplicación
initializeApp();
