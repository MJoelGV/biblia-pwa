let bible = null;
let currentBook = 'Génesis';
let currentChapter = 1;

// Cargar la Biblia
async function loadBible() {
    try {
        const response = await fetch('bible-data.json');
        bible = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error cargando la Biblia:', error);
    }
}

// Inicializar la aplicación
function initializeApp() {
    createBookButtons();
    showChapter(currentBook, currentChapter);
    setupEventListeners();
}

// Crear botones de libros
function createBookButtons() {
    const bookNav = document.querySelector('.book-nav');
    bookNav.innerHTML = ''; // Limpiar navegación existente
    
    Object.keys(bible).forEach(book => {
        const button = document.createElement('button');
        button.textContent = book;
        button.onclick = () => selectBook(book);
        if (book === currentBook) {
            button.classList.add('active');
        }
        bookNav.appendChild(button);
    });
}

// Seleccionar un libro
function selectBook(book) {
    currentBook = book;
    currentChapter = 1;
    updateUI();
}

// Mostrar un capítulo
function showChapter(book, chapter) {
    const content = document.querySelector('.chapter-content');
    if (!bible || !bible[book] || !bible[book][chapter - 1]) {
        content.innerHTML = '<p>Capítulo no encontrado</p>';
        return;
    }

    const verses = bible[book][chapter - 1];
    content.innerHTML = `
        <h2>${book} ${chapter}</h2>
        <div class="verses">
            ${verses.map((verse, index) => `
                <p>
                    <span class="verse-number">${index + 1}</span>
                    ${verse.replace(/\/n/g, ' ')}
                </p>
            `).join('')}
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
        updateUI();
    }
}

// Actualizar la interfaz
function updateUI() {
    // Actualizar botones de libros
    document.querySelectorAll('.book-nav button').forEach(button => {
        button.classList.toggle('active', button.textContent === currentBook);
    });
    
    // Mostrar capítulo actual
    showChapter(currentBook, currentChapter);
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            if (query.length < 3) return;

            const results = [];
            Object.entries(bible).forEach(([book, chapters]) => {
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
            });

            showSearchResults(results);
        }, 300);
    });
}

// Mostrar resultados de búsqueda
function showSearchResults(results) {
    const content = document.querySelector('.chapter-content');
    if (results.length === 0) {
        content.innerHTML = '<p>No se encontraron resultados</p>';
        return;
    }

    content.innerHTML = `
        <h2>Resultados de búsqueda</h2>
        <div class="search-results">
            ${results.map(result => `
                <div class="search-result" onclick="goToVerse('${result.book}', ${result.chapter}, ${result.verse})">
                    <div class="result-location">${result.book} ${result.chapter}:${result.verse}</div>
                    <p>${result.text}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// Ir a un versículo específico
function goToVerse(book, chapter, verse) {
    currentBook = book;
    currentChapter = chapter;
    updateUI();
    // Resaltar el versículo
    setTimeout(() => {
        const verseElement = document.querySelector(`.verses p:nth-child(${verse})`);
        if (verseElement) {
            verseElement.classList.add('highlighted');
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => verseElement.classList.remove('highlighted'), 2000);
        }
    }, 100);
}

// Configurar escuchadores de eventos
function setupEventListeners() {
    setupSearch();

    // Navegación inferior
    document.querySelectorAll('.bottom-nav button').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim();
            switch (action) {
                case 'Libros':
                    document.querySelector('.book-nav').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'Marcadores':
                    // Implementar marcadores
                    break;
                case 'Ajustes':
                    // Implementar ajustes
                    break;
            }
        });
    });
}

// Cargar la Biblia al iniciar
loadBible();
