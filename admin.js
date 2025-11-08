// Script pour le dashboard administrateur

document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadUsers();
    loadClasses();
    loadDevoirs();
    loadNotes();
    setupTabs();
    setupModals();
    // Initialiser les élèves par défaut si nécessaire
    initDefaultEleves();
    
    // Configurer le bouton générer QR codes
    const generateBtn = document.getElementById('generate-qr-codes-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAllQRCodes);
    }
});

// Initialiser les élèves par défaut
function initDefaultEleves() {
    const users = JSON.parse(localStorage.getItem('users')) || { eleves: [], prof: [], admin: [] };
    const eleves = users.eleves || [];
    
    // Nettoyer tous les noms existants pour ne garder que les prénoms
    // Et convertir les classes CE et CEI en CE1
    let hasChanges = false;
    eleves.forEach(eleve => {
        if (eleve.name && eleve.name.includes(' ')) {
            // Si le nom contient un espace, prendre seulement le premier mot (prénom)
            const prenom = eleve.name.split(' ')[0];
            eleve.name = prenom;
            hasChanges = true;
        }
        // Convertir CE et CEI en CE1
        if (eleve.classe === 'CE' || eleve.classe === 'CEI') {
            eleve.classe = 'CE1';
            hasChanges = true;
        }
    });
    
    // Normaliser aussi les classes des professeurs
    const profs = users.prof || [];
    profs.forEach(prof => {
        if (prof.classes && Array.isArray(prof.classes)) {
            const newClasses = prof.classes
                .map(c => c === 'CE' || c === 'CEI' ? 'CE1' : c)
                .filter(c => c === 'CE1' || c === 'CE2');
            if (JSON.stringify(newClasses) !== JSON.stringify(prof.classes)) {
                prof.classes = newClasses;
                hasChanges = true;
            }
        }
    });
    
    // Liste des élèves à créer (uniquement avec les prénoms)
    const defaultElevesList = [
        { prenom: 'Gaïa', classe: 'CE1' },
        { prenom: 'Gabriele', classe: 'CE1' },
        { prenom: 'Noa', classe: 'CE1' },
        { prenom: 'Ophélia', classe: 'CE1' },
        { prenom: 'Jean', classe: 'CE1' },
        { prenom: 'Alexandre', classe: 'CE1' },
        { prenom: 'Maydden', classe: 'CE2' },
        { prenom: 'Lorelei', classe: 'CE2' },
        { prenom: 'Davide', classe: 'CE2' },
        { prenom: 'Maxime', classe: 'CE2' },
        { prenom: 'Paul', classe: 'CE2' },
        { prenom: 'Victor', classe: 'CE2' }
    ];
    
    // Vérifier quels élèves existent déjà
    let hasNewEleves = false;
    defaultElevesList.forEach(eleveData => {
        // L'identifiant est le prénom (sans accents, en minuscules)
        const username = generateUsernameFromPrenom(eleveData.prenom);
        
        // Vérifier si l'élève existe déjà par son identifiant (prénom)
        const exists = eleves.find(e => e.username === username);
        
        if (!exists) {
            hasNewEleves = true;
            const newEleve = {
                id: Date.now() + Math.random(),
                name: eleveData.prenom, // Juste le prénom comme nom
                username: username,
                password: generatePassword(eleveData.prenom),
                classe: eleveData.classe
            };
            eleves.push(newEleve);
        } else {
            // Mettre à jour le nom pour ne garder que le prénom
            if (exists.name !== eleveData.prenom) {
                exists.name = eleveData.prenom;
                hasNewEleves = true;
            }
            // Mettre à jour la classe si nécessaire
            if (exists.classe !== eleveData.classe) {
                exists.classe = eleveData.classe;
                hasNewEleves = true;
            }
        }
    });
    
    if (hasChanges || hasNewEleves) {
        users.eleves = eleves;
        localStorage.setItem('users', JSON.stringify(users));
        // Recharger les données
        loadUsers();
        loadClasses();
        loadOverview();
    }
}

// Générer un identifiant à partir du prénom uniquement
function generateUsernameFromPrenom(prenom) {
    // Nettoyer le prénom (enlever accents, caractères spéciaux, mettre en minuscules)
    const cleanPrenom = prenom.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');
    
    // L'identifiant est le prénom complet (sans accents)
    return cleanPrenom;
}

// Générer un identifiant à partir du prénom et nom (ancienne méthode, gardée pour compatibilité)
function generateUsername(prenom, nom) {
    return generateUsernameFromPrenom(prenom);
}

// Générer un mot de passe à partir du prénom
function generatePassword(prenom) {
    // Mot de passe simple : prénom (sans accents) + "123"
    const cleanPrenom = prenom.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');
    return cleanPrenom + '123';
}

// Charger la vue d'ensemble
function loadOverview() {
    const users = JSON.parse(localStorage.getItem('users')) || { eleves: [], prof: [], admin: [] };
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    
    document.getElementById('total-eleves').textContent = users.eleves?.length || 0;
    document.getElementById('total-profs').textContent = users.prof?.length || 0;
    document.getElementById('total-devoirs').textContent = devoirs.length;
    document.getElementById('total-notes').textContent = notes.length;
}

// Charger les utilisateurs
function loadUsers() {
    loadEleves();
    loadProfs();
    loadAdmins();
}

// Charger les élèves
function loadEleves() {
    const users = JSON.parse(localStorage.getItem('users'));
    const eleves = users.eleves || [];
    const tbody = document.getElementById('eleves-table-body');
    
    if (!tbody) return;
    
    if (eleves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucun élève enregistré</td></tr>';
        return;
    }
    
    tbody.innerHTML = eleves.map(eleve => {
        // Le nom est juste le prénom maintenant
        const prenom = eleve.prenom || eleve.name || eleve.username || '';
        const photo = eleve.photo ? `<img src="${eleve.photo}" alt="${prenom}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${prenom.charAt(0).toUpperCase()}</div>`;
        const qrCodeData = eleve.id || eleve.username || prenom.toLowerCase();
        
        return `
            <tr>
                <td>${photo}</td>
                <td>${prenom}</td>
                <td>${eleve.classe || 'Non assigné'}</td>
                <td>${eleve.username}</td>
                <td><code style="background: #f0f0f0; padding: 0.3rem 0.5rem; border-radius: 4px; font-family: monospace;">${eleve.password || 'N/A'}</code></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="downloadQRCode('${qrCodeData}', '${prenom}')" title="Télécharger QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editEleveAdmin(${eleve.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEleve(${eleve.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Charger les professeurs
function loadProfs() {
    const users = JSON.parse(localStorage.getItem('users'));
    const profs = users.prof || [];
    const tbody = document.getElementById('profs-table-body');
    
    if (!tbody) return;
    
    if (profs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun professeur enregistré</td></tr>';
        return;
    }
    
    tbody.innerHTML = profs.map(prof => {
        const classes = prof.classes ? prof.classes.join(', ') : 'Aucune classe';
        return `
            <tr>
                <td>${prof.name}</td>
                <td>${prof.username}</td>
                <td><code style="background: #f0f0f0; padding: 0.3rem 0.5rem; border-radius: 4px; font-family: monospace;">${prof.password || 'N/A'}</code></td>
                <td>${classes}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProfAdmin('${prof.username}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProf('${prof.username}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Charger les administrateurs
function loadAdmins() {
    const users = JSON.parse(localStorage.getItem('users'));
    const admins = users.admin || [];
    const tbody = document.getElementById('admins-table-body');
    
    if (!tbody) return;
    
    if (admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun administrateur enregistré</td></tr>';
        return;
    }
    
    tbody.innerHTML = admins.map(admin => {
        return `
            <tr>
                <td>${admin.name}</td>
                <td>${admin.username}</td>
                <td><code style="background: #f0f0f0; padding: 0.3rem 0.5rem; border-radius: 4px; font-family: monospace;">${admin.password || 'N/A'}</code></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAdminAdmin('${admin.username}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdmin('${admin.username}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Charger les classes
function loadClasses() {
    const users = JSON.parse(localStorage.getItem('users'));
    const eleves = users.eleves || [];
    const container = document.getElementById('classes-admin-container');
    
    if (!container) return;
    
    // Regrouper les élèves par classe
    const classesMap = {};
    eleves.forEach(eleve => {
        const classe = eleve.classe || 'Non assigné';
        if (!classesMap[classe]) {
            classesMap[classe] = [];
        }
        classesMap[classe].push(eleve);
    });
    
    if (Object.keys(classesMap).length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune classe avec des élèves</p>';
        return;
    }
    
    container.innerHTML = Object.entries(classesMap).map(([classe, elevesClasse]) => `
        <div class="class-admin-card">
            <div class="class-admin-header">
                <h3>${classe}</h3>
                <span class="class-count">${elevesClasse.length} élève(s)</span>
            </div>
            <div class="class-eleves-list">
                ${elevesClasse.map(eleve => `
                    <div class="class-eleve-item">
                        <span>${eleve.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Charger les devoirs
function loadDevoirs() {
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const container = document.getElementById('devoirs-admin-list');
    
    if (!container) return;
    
    if (devoirs.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun devoir enregistré</p>';
        return;
    }
    
    container.innerHTML = devoirs.map(devoir => {
        const date = new Date(devoir.dateLimite);
        return `
        <div class="devoir-card">
            <div class="devoir-header">
                <h3>${devoir.titre}</h3>
                <span class="devoir-matiere">${devoir.matiere}</span>
            </div>
            <div class="devoir-body">
                <p class="devoir-description">${devoir.description || 'Aucune description'}</p>
                <div class="devoir-info">
                    <span><i class="fas fa-users"></i> ${devoir.classe}</span>
                    <span><i class="fas fa-calendar"></i> ${date.toLocaleDateString('fr-FR')}</span>
                    <span><i class="fas fa-user"></i> ${devoir.profId || 'Non assigné'}</span>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Charger les notes
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const container = document.getElementById('notes-admin-content');
    
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune note enregistrée</p>';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const eleves = users.eleves || [];
    
    container.innerHTML = notes.map(note => {
        const eleve = eleves.find(e => e.id == note.eleveId);
        const eleveName = eleve ? eleve.name : `Élève #${note.eleveId}`;
        return `
        <div class="note-card-prof">
            <div class="note-card-header">
                <h3>${eleveName}</h3>
                <span>${note.matiere}</span>
            </div>
            <div class="note-card-details">
                <div class="note-item-prof">
                    <span>${note.devoir || 'Devoir'}</span>
                    <span class="note-value">${note.note}/20</span>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Configuration des onglets
function setupTabs() {
    const tabBtns = document.querySelectorAll('.users-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Configuration des modals
function setupModals() {
    // Modal créer élève
    const addEleveBtn = document.getElementById('add-eleve-admin-btn');
    const addEleveForm = document.getElementById('add-eleve-admin-form');
    if (addEleveBtn) {
        addEleveBtn.addEventListener('click', () => {
            document.getElementById('add-eleve-admin-modal').classList.add('active');
        });
    }
    if (addEleveForm) {
        addEleveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createEleve();
        });
    }
    
    // Modal créer professeur
    const addProfBtn = document.getElementById('add-prof-admin-btn');
    const addProfForm = document.getElementById('add-prof-admin-form');
    if (addProfBtn) {
        addProfBtn.addEventListener('click', () => {
            document.getElementById('add-prof-admin-modal').classList.add('active');
        });
    }
    if (addProfForm) {
        addProfForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createProf();
        });
    }
    
    // Modal créer admin
    const addAdminBtn = document.getElementById('add-admin-btn');
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', () => {
            document.getElementById('add-admin-modal').classList.add('active');
        });
    }
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createAdmin();
        });
    }
    
    // Modal modifier élève
    const editEleveForm = document.getElementById('edit-eleve-admin-form');
    if (editEleveForm) {
        editEleveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditEleve();
        });
    }
    
    // Modal modifier professeur
    const editProfForm = document.getElementById('edit-prof-admin-form');
    if (editProfForm) {
        editProfForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditProf();
        });
    }
    
    // Modal modifier admin
    const editAdminForm = document.getElementById('edit-admin-form');
    if (editAdminForm) {
        editAdminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditAdmin();
        });
    }
}

// Créer un élève
function createEleve() {
    const users = JSON.parse(localStorage.getItem('users'));
    const prenom = document.getElementById('admin-eleve-prenom').value.trim();
    const username = document.getElementById('admin-eleve-username').value.trim();
    const password = document.getElementById('admin-eleve-password').value;
    const classe = document.getElementById('admin-eleve-classe').value;
    const photo = document.getElementById('admin-eleve-photo').value.trim();
    
    if (!prenom || !username || !password || !classe) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà
    const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
    if (allUsers.find(u => u.username === username)) {
        alert('Cet identifiant est déjà utilisé');
        return;
    }
    
    const newEleve = {
        id: Date.now(),
        prenom: prenom,
        name: prenom, // Juste le prénom (compatibilité)
        username: username,
        password: password,
        classe: classe,
        photo: photo || null
    };
    
    if (!users.eleves) users.eleves = [];
    users.eleves.push(newEleve);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadClasses();
    loadOverview();
    closeEleveAdminModal();
    showNotification('Élève créé avec succès !');
}

// Modifier un élève
function editEleveAdmin(id) {
    const users = JSON.parse(localStorage.getItem('users'));
    const eleve = users.eleves.find(e => e.id == id);
    
    if (!eleve) {
        alert('Élève introuvable');
        return;
    }
    
    // Le nom est juste le prénom maintenant
    const prenom = eleve.prenom || eleve.name || eleve.username || '';
    
    document.getElementById('edit-eleve-id').value = eleve.id;
    document.getElementById('edit-eleve-prenom').value = prenom;
    document.getElementById('edit-eleve-username').value = eleve.username;
    document.getElementById('edit-eleve-password').value = '';
    document.getElementById('edit-eleve-classe').value = eleve.classe || '';
    document.getElementById('edit-eleve-photo').value = eleve.photo || '';
    
    document.getElementById('edit-eleve-admin-modal').classList.add('active');
}

// Enregistrer les modifications d'un élève
function saveEditEleve() {
    const users = JSON.parse(localStorage.getItem('users'));
    const id = parseInt(document.getElementById('edit-eleve-id').value);
    const prenom = document.getElementById('edit-eleve-prenom').value.trim();
    const username = document.getElementById('edit-eleve-username').value.trim();
    const password = document.getElementById('edit-eleve-password').value;
    const classe = document.getElementById('edit-eleve-classe').value;
    const photo = document.getElementById('edit-eleve-photo').value.trim();
    
    const eleveIndex = users.eleves.findIndex(e => e.id == id);
    if (eleveIndex === -1) {
        alert('Élève introuvable');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà (sauf pour cet élève)
    const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
    if (allUsers.find(u => u.username === username && u.id !== id && (!u.username || u.username !== users.eleves[eleveIndex].username))) {
        alert('Cet identifiant est déjà utilisé');
        return;
    }
    
    users.eleves[eleveIndex].prenom = prenom;
    users.eleves[eleveIndex].name = prenom; // Juste le prénom (compatibilité)
    users.eleves[eleveIndex].username = username;
    if (password) {
        users.eleves[eleveIndex].password = password;
    }
    users.eleves[eleveIndex].classe = classe;
    if (photo) {
        users.eleves[eleveIndex].photo = photo;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadClasses();
    loadOverview();
    closeEditEleveAdminModal();
    showNotification('Élève modifié avec succès !');
}

// Créer un professeur
function createProf() {
    const users = JSON.parse(localStorage.getItem('users'));
    const name = document.getElementById('admin-prof-name').value.trim();
    const username = document.getElementById('admin-prof-username').value.trim();
    const password = document.getElementById('admin-prof-password').value;
    const classesStr = document.getElementById('admin-prof-classes').value.trim();
    
    if (!name || !username || !password) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà
    const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
    if (allUsers.find(u => u.username === username)) {
        alert('Cet identifiant est déjà utilisé');
        return;
    }
    
    const classes = classesStr ? classesStr.split(',').map(c => c.trim()).filter(c => c) : [];
    
    const newProf = {
        username: username,
        password: password,
        name: name,
        classes: classes
    };
    
    if (!users.prof) users.prof = [];
    users.prof.push(newProf);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadOverview();
    closeProfAdminModal();
    showNotification('Professeur créé avec succès !');
}

// Modifier un professeur
function editProfAdmin(username) {
    const users = JSON.parse(localStorage.getItem('users'));
    const prof = users.prof.find(p => p.username === username);
    
    if (!prof) {
        alert('Professeur introuvable');
        return;
    }
    
    document.getElementById('edit-prof-username-old').value = prof.username;
    document.getElementById('edit-prof-name').value = prof.name;
    document.getElementById('edit-prof-username').value = prof.username;
    document.getElementById('edit-prof-password').value = '';
    document.getElementById('edit-prof-classes').value = prof.classes ? prof.classes.join(', ') : '';
    
    document.getElementById('edit-prof-admin-modal').classList.add('active');
}

// Enregistrer les modifications d'un professeur
function saveEditProf() {
    const users = JSON.parse(localStorage.getItem('users'));
    const oldUsername = document.getElementById('edit-prof-username-old').value;
    const name = document.getElementById('edit-prof-name').value.trim();
    const username = document.getElementById('edit-prof-username').value.trim();
    const password = document.getElementById('edit-prof-password').value;
    const classesStr = document.getElementById('edit-prof-classes').value.trim();
    
    const profIndex = users.prof.findIndex(p => p.username === oldUsername);
    if (profIndex === -1) {
        alert('Professeur introuvable');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà (sauf pour ce prof)
    if (username !== oldUsername) {
        const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
        if (allUsers.find(u => u.username === username)) {
            alert('Cet identifiant est déjà utilisé');
            return;
        }
    }
    
    const classes = classesStr ? classesStr.split(',').map(c => c.trim()).filter(c => c) : [];
    
    users.prof[profIndex].name = name;
    users.prof[profIndex].username = username;
    if (password) {
        users.prof[profIndex].password = password;
    }
    users.prof[profIndex].classes = classes;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadOverview();
    closeEditProfAdminModal();
    showNotification('Professeur modifié avec succès !');
}

// Créer un administrateur
function createAdmin() {
    const users = JSON.parse(localStorage.getItem('users'));
    const name = document.getElementById('admin-name-input').value.trim();
    const username = document.getElementById('admin-username-input').value.trim();
    const password = document.getElementById('admin-password-input').value;
    
    if (!name || !username || !password) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà
    const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
    if (allUsers.find(u => u.username === username)) {
        alert('Cet identifiant est déjà utilisé');
        return;
    }
    
    const newAdmin = {
        username: username,
        password: password,
        name: name
    };
    
    if (!users.admin) users.admin = [];
    users.admin.push(newAdmin);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadOverview();
    closeAdminModal();
    showNotification('Administrateur créé avec succès !');
}

// Modifier un administrateur
function editAdminAdmin(username) {
    const users = JSON.parse(localStorage.getItem('users'));
    const admin = users.admin.find(a => a.username === username);
    
    if (!admin) {
        alert('Administrateur introuvable');
        return;
    }
    
    document.getElementById('edit-admin-username-old').value = admin.username;
    document.getElementById('edit-admin-name').value = admin.name;
    document.getElementById('edit-admin-username').value = admin.username;
    document.getElementById('edit-admin-password').value = '';
    
    document.getElementById('edit-admin-modal').classList.add('active');
}

// Enregistrer les modifications d'un administrateur
function saveEditAdmin() {
    const users = JSON.parse(localStorage.getItem('users'));
    const oldUsername = document.getElementById('edit-admin-username-old').value;
    const name = document.getElementById('edit-admin-name').value.trim();
    const username = document.getElementById('edit-admin-username').value.trim();
    const password = document.getElementById('edit-admin-password').value;
    
    const adminIndex = users.admin.findIndex(a => a.username === oldUsername);
    if (adminIndex === -1) {
        alert('Administrateur introuvable');
        return;
    }
    
    // Vérifier si l'identifiant existe déjà (sauf pour cet admin)
    if (username !== oldUsername) {
        const allUsers = [...(users.eleves || []), ...(users.prof || []), ...(users.admin || [])];
        if (allUsers.find(u => u.username === username)) {
            alert('Cet identifiant est déjà utilisé');
            return;
        }
    }
    
    users.admin[adminIndex].name = name;
    users.admin[adminIndex].username = username;
    if (password) {
        users.admin[adminIndex].password = password;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadOverview();
    closeEditAdminModal();
    showNotification('Administrateur modifié avec succès !');
}

// Supprimer un élève
function deleteEleve(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    users.eleves = users.eleves.filter(e => e.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Supprimer aussi les notes de cet élève
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const filteredNotes = notes.filter(n => n.eleveId != id);
    localStorage.setItem('notes', JSON.stringify(filteredNotes));
    
    loadUsers();
    loadClasses();
    loadOverview();
    loadNotes();
    showNotification('Élève supprimé.');
}

// Supprimer un professeur
function deleteProf(username) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    users.prof = users.prof.filter(p => p.username !== username);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Supprimer aussi les devoirs et notes de ce prof
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const filteredDevoirs = devoirs.filter(d => d.profId !== username);
    localStorage.setItem('devoirs', JSON.stringify(filteredDevoirs));
    
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const filteredNotes = notes.filter(n => n.profId !== username);
    localStorage.setItem('notes', JSON.stringify(filteredNotes));
    
    loadUsers();
    loadOverview();
    loadDevoirs();
    loadNotes();
    showNotification('Professeur supprimé.');
}

// Supprimer un administrateur
function deleteAdmin(username) {
    const users = JSON.parse(localStorage.getItem('users'));
    const admins = users.admin || [];
    
    if (admins.length <= 1) {
        alert('Impossible de supprimer le dernier administrateur !');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;
    
    users.admin = users.admin.filter(a => a.username !== username);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsers();
    loadOverview();
    showNotification('Administrateur supprimé.');
}

// Fermer les modals
function closeEleveAdminModal() {
    document.getElementById('add-eleve-admin-modal').classList.remove('active');
    document.getElementById('add-eleve-admin-form').reset();
}

function closeEditEleveAdminModal() {
    document.getElementById('edit-eleve-admin-modal').classList.remove('active');
    document.getElementById('edit-eleve-admin-form').reset();
}

function closeProfAdminModal() {
    document.getElementById('add-prof-admin-modal').classList.remove('active');
    document.getElementById('add-prof-admin-form').reset();
}

function closeEditProfAdminModal() {
    document.getElementById('edit-prof-admin-modal').classList.remove('active');
    document.getElementById('edit-prof-admin-form').reset();
}

function closeAdminModal() {
    document.getElementById('add-admin-modal').classList.remove('active');
    document.getElementById('add-admin-form').reset();
}

function closeEditAdminModal() {
    document.getElementById('edit-admin-modal').classList.remove('active');
    document.getElementById('edit-admin-form').reset();
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== GESTION QR CODES ====================

// Générer et télécharger un QR code pour un élève
function downloadQRCode(data, prenom) {
    // Utiliser une bibliothèque QR code en ligne ou générer localement
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QRCode_${prenom}_${data}.png`;
    link.click();
}

// Générer tous les QR codes
function generateAllQRCodes() {
    const users = JSON.parse(localStorage.getItem('users'));
    const eleves = users.eleves || [];
    
    if (eleves.length === 0) {
        alert('Aucun élève à traiter');
        return;
    }
    
    if (confirm(`Générer les QR codes pour ${eleves.length} élève(s) ?\n\nLes QR codes seront téléchargés un par un.`)) {
        eleves.forEach((eleve, index) => {
            setTimeout(() => {
                const data = eleve.id || eleve.username || (eleve.prenom || eleve.name || '').toLowerCase();
                const prenom = eleve.prenom || eleve.name || eleve.username || 'Eleve';
                downloadQRCode(data, prenom);
            }, index * 500); // Délai de 500ms entre chaque téléchargement
        });
    }
}

// Exposer les fonctions globalement
window.deleteEleve = deleteEleve;
window.deleteProf = deleteProf;
window.deleteAdmin = deleteAdmin;
window.editEleveAdmin = editEleveAdmin;
window.editProfAdmin = editProfAdmin;
window.editAdminAdmin = editAdminAdmin;
window.closeEleveAdminModal = closeEleveAdminModal;
window.downloadQRCode = downloadQRCode;
window.generateAllQRCodes = generateAllQRCodes;
window.closeEditEleveAdminModal = closeEditEleveAdminModal;
window.closeProfAdminModal = closeProfAdminModal;
window.closeEditProfAdminModal = closeEditProfAdminModal;
window.closeAdminModal = closeAdminModal;
window.closeEditAdminModal = closeEditAdminModal;
