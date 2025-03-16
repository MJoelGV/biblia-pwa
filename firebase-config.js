// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBTBGGZzwjL64E1vKYybf7wM8kGRTnModU",
    authDomain: "biblia-pwa.firebaseapp.com",
    projectId: "biblia-pwa",
    storageBucket: "biblia-pwa.firebasestorage.app",
    messagingSenderId: "9526308124",
    appId: "1:9526308124:web:4f3954ed03a5ee57b14a05",
    measurementId: "G-7LN8GVSSHC"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar las referencias que necesitamos
const auth = firebase.auth();
const db = firebase.firestore();

// Exportar para usar en otros archivos
export { auth, db };
