let bible = null;
let currentBook = 'Génesis';
let currentChapter = 1;

// Organización de los libros
const bibleStructure = {
    antiguoTestamento: [
        "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut",
        "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras",
        "Nehemías", "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares",
        "Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel",
        "Amós", "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo",
        "Zacarías", "Malaquías"
    ],
    nuevoTestamento: [
        "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios",
        "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses",
        "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos",
        "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
    ]
};

// Almacenamiento local para favoritos
let favorites = JSON.parse(localStorage.getItem('bibleFavorites')) || [];

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
    showHomePage();
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

// Mostrar página principal
function showHomePage() {
    const content = document.querySelector('.chapter-content');
    const { chapter, verse } = getProverbOfTheDay();
    
    if (!bible || !bible["Proverbios"] || !bible["Proverbios"][chapter - 1]) {
        content.innerHTML = '<p>Cargando...</p>';
        return;
    }

    const proverbio = bible["Proverbios"][chapter - 1][verse - 1];
    content.innerHTML = `
        <div class="home-content">
            <h2>Proverbio del Día</h2>
            <div class="proverb-of-day">
                <p class="reference">Proverbios ${chapter}:${verse}</p>
                <p class="verse">${proverbio.replace(/\/n/g, ' ')}</p>
                <button onclick="shareVerse('Proverbios', ${chapter}, ${verse})" class="share-button">
                    <i class="material-icons">share</i> Compartir
                </button>
            </div>
            <div class="testament-section">
                <h3>Antiguo Testamento</h3>
                <div class="book-grid">
                    ${bibleStructure.antiguoTestamento.map(book => 
                        `<button onclick="selectBook('${book}')">${book}</button>`
                    ).join('')}
                </div>
                <h3>Nuevo Testamento</h3>
                <div class="book-grid">
                    ${bibleStructure.nuevoTestamento.map(book => 
                        `<button onclick="selectBook('${book}')">${book}</button>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
}

// Función para obtener el proverbio del día
function getProverbOfTheDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const chapter = (dayOfYear % 31) + 1;
    const verse = (dayOfYear % 20) + 1;
    return { chapter, verse };
}

// Función para compartir versículos
async function shareVerse(book, chapter, verse) {
    const text = bible[book][chapter - 1][verse - 1].replace(/\/n/g, ' ');
    const shareText = `${book} ${chapter}:${verse} - ${text}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Biblia Reina Valera',
                text: shareText
            });
        } catch (err) {
            console.log('Error al compartir:', err);
        }
    } else {
        // Fallback para navegadores que no soportan Web Share API
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('¡Versículo copiado al portapapeles!');
    }
}

// Función para agregar/quitar favoritos
function toggleFavorite(book, chapter, verse) {
    const key = `${book}-${chapter}-${verse}`;
    const index = favorites.findIndex(f => f.key === key);
    
    if (index === -1) {
        favorites.push({ key, book, chapter, verse });
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('bibleFavorites', JSON.stringify(favorites));
    showChapter(book, chapter); // Actualizar la vista
}

// Mostrar favoritos
function showFavorites() {
    const content = document.querySelector('.chapter-content');
    content.innerHTML = `
        <h2>Mis Versículos Favoritos</h2>
        <div class="favorites-list">
            ${favorites.map(f => {
                const verse = bible[f.book][f.chapter - 1][f.verse - 1];
                return `
                    <div class="favorite-item">
                        <p class="reference">${f.book} ${f.chapter}:${f.verse}</p>
                        <p class="verse">${verse.replace(/\/n/g, ' ')}</p>
                        <div class="verse-actions">
                            <button onclick="shareVerse('${f.book}', ${f.chapter}, ${f.verse})">
                                <i class="material-icons">share</i>
                            </button>
                            <button onclick="toggleFavorite('${f.book}', ${f.chapter}, ${f.verse})">
                                <i class="material-icons">star</i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('') || '<p>No tienes versículos favoritos guardados.</p>'}
        </div>
    `;
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
            ${verses.map((verse, index) => {
                const verseNum = index + 1;
                const isFavorite = favorites.some(f => 
                    f.book === book && f.chapter === chapter && f.verse === verseNum
                );
                return `
                    <p>
                        <span class="verse-number">${verseNum}</span>
                        ${verse.replace(/\/n/g, ' ')}
                        <div class="verse-actions">
                            <button onclick="shareVerse('${book}', ${chapter}, ${verseNum})">
                                <i class="material-icons">share</i>
                            </button>
                            <button onclick="toggleFavorite('${book}', ${chapter}, ${verseNum})" 
                                    class="favorite-button ${isFavorite ? 'active' : ''}">
                                <i class="material-icons">${isFavorite ? 'star' : 'star_border'}</i>
                            </button>
                        </div>
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
