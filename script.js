// Système d'authentification et données de base

// Utilisateurs par défaut
const defaultUsers = {
    admin: [
        { username: 'admin', password: 'admin123', name: 'Administrateur' }
    ],
    prof: [
        { username: 'alexiag', password: 'alexiagoletto', name: 'Mme Oletto', classes: ['CE1', 'CE2'] }
    ],
    eleves: [
        { username: 'eleve1', password: 'eleve123', name: 'Jean Martin', classe: 'CE1', id: 1 },
        { username: 'eleve2', password: 'eleve123', name: 'Marie Dubois', classe: 'CE1', id: 2 },
        { username: 'eleve3', password: 'eleve123', name: 'Pierre Bernard', classe: 'CE2', id: 3 }
    ]
};

// Initialiser les données
function initData() {
    try {
        // Vérifier si localStorage est disponible (important sur mobile)
        if (typeof(Storage) === "undefined") {
            console.error('localStorage non disponible');
            return false;
        }
        
        const usersData = localStorage.getItem('users');
        if (!usersData) {
            // Forcer l'écriture des données par défaut
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('Données utilisateurs initialisées avec identifiants par défaut');
        } else {
            // S'assurer que la structure est correcte et que les identifiants par défaut existent
            try {
                const users = JSON.parse(usersData);
                let needsUpdate = false;
                
                // Vérifier et restaurer les admins par défaut
                if (!users.admin || users.admin.length === 0) {
                    users.admin = defaultUsers.admin;
                    needsUpdate = true;
                } else {
                    // S'assurer que l'admin par défaut existe
                    const defaultAdmin = users.admin.find(a => a.username === 'admin');
                    if (!defaultAdmin) {
                        users.admin = defaultUsers.admin;
                        needsUpdate = true;
                    }
                }
                
                // Nettoyer l'ancien identifiant par défaut (prof1)
                if (users.prof && users.prof.length > 0) {
                    const cleanedProfList = users.prof.filter(p => (p.username || '').toLowerCase() !== 'prof1');
                    if (cleanedProfList.length !== users.prof.length) {
                        users.prof = cleanedProfList;
                        needsUpdate = true;
                    }
                }

                // Vérifier et restaurer les profs par défaut
                if (!users.prof || users.prof.length === 0) {
                    users.prof = defaultUsers.prof;
                    needsUpdate = true;
                } else {
                    // S'assurer que le prof par défaut existe
                    const defaultProf = users.prof.find(p => p.username === 'alexiag');
                    if (!defaultProf) {
                        // Ajouter le prof par défaut s'il n'existe pas
                        users.prof.unshift(defaultUsers.prof[0]);
                        needsUpdate = true;
                    } else {
                        // Harmoniser ses informations au cas où elles auraient été modifiées
                        const index = users.prof.findIndex(p => p.username === 'alexiag');
                        const reference = defaultUsers.prof[0];
                        if (index !== -1 && (
                            users.prof[index].password !== reference.password ||
                            users.prof[index].name !== reference.name
                        )) {
                            users.prof[index] = { ...users.prof[index], ...reference };
                            needsUpdate = true;
                        }
                    }
                }
                
                // Vérifier les élèves - ne pas écraser s'il y en a déjà
                if (!users.eleves || users.eleves.length === 0) {
                    // Seulement si aucun élève n'existe, utiliser les élèves par défaut
                    users.eleves = defaultUsers.eleves;
                    needsUpdate = true;
                }
                // Sinon, garder les élèves existants (créés par l'admin)
                
                if (needsUpdate) {
                    localStorage.setItem('users', JSON.stringify(users));
                    console.log('Données utilisateurs mises à jour avec identifiants par défaut');
                }
            } catch (e) {
                console.error('Erreur parsing users, réinitialisation:', e);
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
        }
        
    if (!localStorage.getItem('devoirs')) {
        localStorage.setItem('devoirs', JSON.stringify([]));
    } else {
        try {
            const devoirs = JSON.parse(localStorage.getItem('devoirs'));
            if (!Array.isArray(devoirs)) {
                localStorage.setItem('devoirs', JSON.stringify([]));
            } else {
                // Purger uniquement les vieux devoirs sans prof ni classe pour éviter les doublons 2024
                const filtered = devoirs.filter(devoir => devoir && devoir.profId && devoir.classe);
                if (filtered.length !== devoirs.length) {
                    console.log('Nettoyage des anciens devoirs');
                    localStorage.setItem('devoirs', JSON.stringify(filtered));
                }
            }
        } catch (e) {
            console.warn('Devoirs invalides détectés, réinitialisation', e);
            localStorage.setItem('devoirs', JSON.stringify([]));
        }
    }
    if (!localStorage.getItem('notes')) {
        localStorage.setItem('notes', JSON.stringify([]));
    }
    if (!localStorage.getItem('emploiDuTemps')) {
        localStorage.setItem('emploiDuTemps', JSON.stringify({}));
        }
        
        return true;
    } catch (e) {
        console.error('Erreur lors de l\'initialisation:', e);
        return false;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les données immédiatement
    const initResult = initData();
    if (!initResult) {
        console.error('Échec de l\'initialisation des données');
    }
    
    // Vérifier que les données sont bien présentes après un court délai (important sur mobile)
    setTimeout(() => {
        const usersData = localStorage.getItem('users');
        if (!usersData) {
            console.warn('Données non trouvées après initialisation, réinitialisation...');
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        } else {
            try {
                const users = JSON.parse(usersData);
                // Vérifier que chaque type d'utilisateur existe
                if (!users.admin || users.admin.length === 0 || 
                    !users.prof || users.prof.length === 0 || 
                    !users.eleves || users.eleves.length === 0) {
                    console.warn('Données incomplètes, complétion...');
                    if (!users.admin || users.admin.length === 0) users.admin = defaultUsers.admin;
                    if (!users.prof || users.prof.length === 0) users.prof = defaultUsers.prof;
                    if (!users.eleves || users.eleves.length === 0) users.eleves = defaultUsers.eleves;
                    localStorage.setItem('users', JSON.stringify(users));
                }
            } catch (e) {
                console.error('Erreur lors de la vérification des données:', e);
                localStorage.setItem('users', JSON.stringify(defaultUsers));
            }
        }
    }, 200);
    
    // Gestion des onglets de connexion
    if (document.querySelector('.login-tabs')) {
        setupLoginTabs();
        setupLoginForms();
    }
    
    // Vérifier si déjà connecté
    checkAuth();
    
    // Navigation dashboard
    if (document.querySelector('.dashboard-nav')) {
        setupNavigation();
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Gestion des onglets login
function setupLoginTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            
            // Activer l'onglet
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Afficher le bon formulaire
            document.querySelectorAll('.login-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabType}-form`).classList.add('active');
        });
    });
}

// Gestion des formulaires de connexion
function setupLoginForms() {
    // Formulaire professeur
    const profForm = document.getElementById('login-prof-form');
    if (profForm) {
        profForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login('prof');
        });
    }
    
    // Formulaire élève
    const eleveForm = document.getElementById('login-eleve-form');
    if (eleveForm) {
        eleveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login('eleve');
        });
    }
    
    // Formulaire admin
    const adminForm = document.getElementById('login-admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login('admin');
        });
    }
}

// Fonction de connexion (fonctionne sur PC et mobile)
function login(type) {
    console.log('Tentative de connexion:', type);
    
    const usernameInput = document.getElementById(`${type}-username`);
    const passwordInput = document.getElementById(`${type}-password`);
    
    if (!usernameInput || !passwordInput) {
        console.error('Champs introuvables:', type);
        alert('Erreur : formulaire de connexion introuvable');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('Identifiants saisis:', { type, username, passwordLength: password.length });
    
    if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Initialiser les données
    initData();
    
    // Vérification directe pour admin et prof (fonctionne sur PC et mobile)
    let isValid = false;
    let userData = null;
    let redirectUrl = '';
    
    // Normaliser le username pour la comparaison
    const normalizedUsername = username.toLowerCase().trim();
    
    if (type === 'admin') {
        if (normalizedUsername === 'admin' && password === 'admin123') {
            console.log('Connexion admin validée');
            isValid = true;
            userData = { username: 'admin', password: 'admin123', name: 'Administrateur' };
            redirectUrl = 'dashboard-admin.html';
        } else {
            console.log('Connexion admin échouée:', { normalizedUsername, passwordMatch: password === 'admin123' });
        }
    } else if (type === 'prof') {
        if (normalizedUsername === 'alexiag' && password === 'alexiagoletto') {
            console.log('Connexion prof validée');
            isValid = true;
            userData = { username: 'alexiag', password: 'alexiagoletto', name: 'Mme Oletto', classes: ['CE1', 'CE2'] };
            redirectUrl = 'dashboard-prof.html';
    } else {
            console.log('Connexion prof échouée:', { normalizedUsername, passwordMatch: password === 'alexiagoletto' });
        }
    }
    
    // Si identifiant direct valide, connecter immédiatement (PC et mobile)
    if (isValid && userData) {
        try {
            const session = {
                type: type,
                user: userData,
                timestamp: Date.now()
            };
            
            // Sauvegarder la session
            localStorage.setItem('session', JSON.stringify(session));
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            
            console.log('Session sauvegardée, redirection vers:', redirectUrl);
            
            // Vider les champs
            usernameInput.value = '';
            passwordInput.value = '';
            
            // Redirection immédiate (fonctionne sur PC et mobile)
            window.location.href = redirectUrl;
            return;
        } catch (e) {
            console.error('Erreur sauvegarde session:', e);
            alert('Erreur lors de la connexion. Réessayez.');
            return;
        }
    }
    
    // Pour les élèves, utiliser localStorage (avec délai pour compatibilité)
    setTimeout(() => {
        try {
            let usersData = localStorage.getItem('users');
            if (!usersData) {
                localStorage.setItem('users', JSON.stringify(defaultUsers));
                usersData = localStorage.getItem('users');
            }
            
            if (!usersData) {
                alert('Erreur : impossible d\'accéder aux données. Réessayez.');
                return;
            }
            
            const users = JSON.parse(usersData);
            const userList = users.eleves || [];
            
            console.log('Recherche élève:', { username, userListCount: userList.length });
    
            const user = userList.find(u => {
                const uUsername = (u.username || '').toLowerCase().trim();
                const uPassword = (u.password || '').toString().trim();
                const inputUsername = normalizedUsername;
                const inputPassword = password.trim();
                
                const match = uUsername === inputUsername && uPassword === inputPassword;
                if (match) {
                    console.log('Élève trouvé:', u.username);
                }
                return match;
            });
    
    if (user) {
        const session = {
                    type: 'eleve',
            user: user,
            timestamp: Date.now()
        };
        localStorage.setItem('session', JSON.stringify(session));
                usernameInput.value = '';
                passwordInput.value = '';
                console.log('Redirection élève vers dashboard-eleve.html');
                window.location.href = 'dashboard-eleve.html';
        } else {
                console.log('Élève non trouvé');
                alert('Identifiant ou mot de passe incorrect !\n\nAdmin: admin / admin123\nProf: alexiag / alexiagoletto');
                passwordInput.value = '';
            }
        } catch (e) {
            console.error('Erreur connexion élève:', e);
            alert('Erreur lors de la connexion. Réessayez.');
    }
    }, 50);
}

// Vérifier l'authentification
function checkAuth() {
    const session = localStorage.getItem('session');
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    
    // Si on est sur un dashboard mais pas connecté, rediriger vers login
    if ((currentPage === 'dashboard-prof.html' || currentPage === 'dashboard-eleve.html' || currentPage === 'dashboard-admin.html')) {
        if (!session) {
        window.location.href = 'index.html';
            return;
    }
        
        try {
            const sessionData = JSON.parse(session);
    
    // Vérifier le type de session
    if (currentPage === 'dashboard-admin.html' && sessionData.type !== 'admin') {
                localStorage.removeItem('session');
        window.location.href = 'index.html';
                return;
    }
    if (currentPage === 'dashboard-prof.html' && sessionData.type !== 'prof') {
                localStorage.removeItem('session');
        window.location.href = 'index.html';
                return;
    }
    if (currentPage === 'dashboard-eleve.html' && sessionData.type !== 'eleve') {
                localStorage.removeItem('session');
        window.location.href = 'index.html';
                return;
    }
    
    // Afficher le nom de l'utilisateur
    displayUserName(sessionData);
        } catch (e) {
            console.error('Erreur lors de la vérification de session:', e);
            localStorage.removeItem('session');
            window.location.href = 'index.html';
        }
    } else if (currentPage === 'index.html' || currentPage === '' || currentPage.includes('index') || !currentPage.includes('.')) {
        // Si on est sur la page de login mais connecté, rediriger
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                // Ne rediriger que si la session est valide
                if (sessionData && sessionData.type && sessionData.user) {
                    if (sessionData.type === 'admin') {
                        window.location.href = 'dashboard-admin.html';
                    } else if (sessionData.type === 'prof') {
                        window.location.href = 'dashboard-prof.html';
                    } else if (sessionData.type === 'eleve') {
                        window.location.href = 'dashboard-eleve.html';
                    }
                } else {
                    // Session invalide, la supprimer
                    localStorage.removeItem('session');
                }
            } catch (e) {
                console.error('Erreur lors de la redirection:', e);
                localStorage.removeItem('session');
            }
        }
    }
}

// Afficher le nom de l'utilisateur
function displayUserName(sessionData) {
    // Essayer différents IDs possibles
    const possibleIds = [
        `${sessionData.type}-name`,
        'prof-name',
        'eleve-name',
        'admin-name',
        'user-name'
    ];
    
    for (const id of possibleIds) {
        const nameEl = document.getElementById(id);
    if (nameEl) {
        nameEl.textContent = sessionData.user.name || sessionData.user.username;
            break;
        }
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('session');
    window.location.href = 'index.html';
}

// Navigation dashboard
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            // Désactiver tous les boutons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Masquer toutes les sections
            sections.forEach(s => s.classList.remove('active'));
            
            // Afficher la section cible
            const section = document.getElementById(`${targetSection}-section`);
            if (section) {
                section.classList.add('active');
            }
        });
    });
}

// Obtenir la session actuelle
function getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
}

