// Importar configuración de Firebase
import { auth } from './firebase-config.js';

// Estado del usuario
let currentUser = null;

// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI();
});

// Actualizar la interfaz según el estado de autenticación
function updateUI() {
    const loginButton = document.getElementById('loginButton');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        // Usuario autenticado
        loginButton.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.displayName;
    } else {
        // Usuario no autenticado
        loginButton.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// Iniciar sesión con Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        showToast('¡Bienvenido!');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showToast('Error al iniciar sesión');
    }
}

// Cerrar sesión
async function logout() {
    try {
        await auth.signOut();
        showToast('Sesión cerrada');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión');
    }
}

// Exportar funciones
export { loginWithGoogle, logout, currentUser };
