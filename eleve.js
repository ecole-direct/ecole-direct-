// Script pour le dashboard élève

document.addEventListener('DOMContentLoaded', () => {
    // Normaliser les classes des élèves (migrer les anciennes classes vers les nouvelles)
    normalizeEleveClasses();
    loadDevoirs();
    loadNotes();
    loadEmploiTemps();
    loadProfil();
});

// Normaliser les classes des élèves (migrer les anciennes classes)
function normalizeEleveClasses() {
    const users = JSON.parse(localStorage.getItem('users')) || { eleves: [], prof: [], admin: [] };
    const eleves = users.eleves || [];
    let hasChanges = false;
    
    // Mapping des anciennes classes vers les nouvelles
    const classMapping = {
        '6ème A': 'CE1',
        '6ème B': 'CE1',
        '5ème A': 'CE2',
        '5ème B': 'CE2',
        '4ème A': 'CE2',
        '4ème B': 'CE2',
        '3ème A': 'CE2',
        '3ème B': 'CE2',
        'CE': 'CE1', // Convertir CE en CE1
        'CEI': 'CE1' // Convertir CEI en CE1
    };
    
    // Normaliser les classes des élèves
    eleves.forEach(eleve => {
        if (eleve.classe && classMapping[eleve.classe]) {
            eleve.classe = classMapping[eleve.classe];
            hasChanges = true;
        }
    });
    
    // Normaliser les classes des professeurs
    const profs = users.prof || [];
    profs.forEach(prof => {
        if (prof.classes && Array.isArray(prof.classes)) {
            const newClasses = prof.classes.map(classe => classMapping[classe] || classe);
            if (JSON.stringify(newClasses) !== JSON.stringify(prof.classes)) {
                prof.classes = newClasses;
                hasChanges = true;
            }
        }
    });
    
    if (hasChanges) {
        users.eleves = eleves;
        users.prof = profs;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Normaliser les classes dans les devoirs
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    let devoirsChanged = false;
    devoirs.forEach(devoir => {
        if (devoir.classe && classMapping[devoir.classe]) {
            devoir.classe = classMapping[devoir.classe];
            devoirsChanged = true;
        }
    });
    
    if (devoirsChanged) {
        localStorage.setItem('devoirs', JSON.stringify(devoirs));
    }
}

function normalizeClasseValue(classe) {
    if (classe === undefined || classe === null) {
        return '';
    }
    return classe.toString().trim().toUpperCase();
}

// Charger les devoirs de l'élève
function loadDevoirs() {
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const session = getSession();
    const container = document.getElementById('devoirs-list');
    
    if (!container) return;
    
    // Filtrer les devoirs de la classe de l'élève
    const eleveClasse = session?.user?.classe || '';
    const eleveClasseNorm = normalizeClasseValue(eleveClasse);
    const eleveDevoirs = devoirs.filter(devoir => {
        const devoirClasseNorm = normalizeClasseValue(devoir?.classe);
        return devoirClasseNorm && devoirClasseNorm === eleveClasseNorm;
    });
    
    if (eleveDevoirs.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun devoir assigné pour le moment.</p>';
        return;
    }
    
    container.innerHTML = eleveDevoirs.map(devoir => {
        const dateLimite = new Date(devoir.dateLimite);
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        const diffTime = dateLimite - aujourdhui;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let badgeClass = '';
        let badgeText = '';
        if (diffDays < 0) {
            badgeClass = 'badge-danger';
            badgeText = 'En retard';
        } else if (diffDays <= 3) {
            badgeClass = 'badge-warning';
            badgeText = 'Urgent';
        }
        
        return `
        <div class="devoir-card ${diffDays < 0 ? 'retard' : diffDays <= 3 ? 'urgent' : ''}">
            <div class="devoir-header">
                <h3>${devoir.titre}</h3>
                <span class="devoir-matiere">${devoir.matiere}</span>
            </div>
            <div class="devoir-body">
                <p class="devoir-description">${devoir.description || 'Aucune description'}</p>
                <div class="devoir-info">
                    <span><i class="fas fa-calendar"></i> ${formatDate(devoir.dateLimite)}</span>
                    ${badgeText ? `<span class="badge ${badgeClass}">${badgeText}</span>` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Charger les notes de l'élève
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const session = getSession();
    const container = document.getElementById('notes-content');
    
    if (!container) return;
    
    const eleveId = session?.user?.id;
    const eleveNotes = notes.filter(n => n.eleveId == eleveId);
    
    if (eleveNotes.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune note pour le moment.</p>';
        return;
    }
    
    // Calculer la moyenne
    const moyenne = eleveNotes.reduce((sum, note) => sum + note.note, 0) / eleveNotes.length;
    
    // Grouper par matière
    const notesParMatiere = {};
    eleveNotes.forEach(note => {
        if (!notesParMatiere[note.matiere]) {
            notesParMatiere[note.matiere] = [];
        }
        notesParMatiere[note.matiere].push(note);
    });
    
    container.innerHTML = `
        <div class="moyenne-card">
            <h3>Moyenne générale</h3>
            <div class="moyenne-value">${moyenne.toFixed(2)}/20</div>
        </div>
        ${Object.entries(notesParMatiere).map(([matiere, notesMatiere]) => {
            const moyenneMatiere = notesMatiere.reduce((sum, note) => sum + note.note, 0) / notesMatiere.length;
            return `
                <div class="note-card-eleve">
                    <div class="note-card-header">
                        <h3>${matiere}</h3>
                        <span class="moyenne-matiere">Moyenne: ${moyenneMatiere.toFixed(2)}/20</span>
                    </div>
                    <div class="note-card-details">
                        ${notesMatiere.map(note => `
                            <div class="note-item-eleve">
                                <span>${note.devoir || 'Devoir'}</span>
                                <span class="note-value">${note.note}/20</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// Charger l'emploi du temps
function loadEmploiTemps() {
    const session = getSession();
    const eleveClasse = session?.user?.classe || '';
    const emploiDuTemps = JSON.parse(localStorage.getItem('emploiDuTemps')) || {};
    
    // Trouver l'emploi du temps d'un prof qui a cette classe
    let profEmploi = null;
    const users = JSON.parse(localStorage.getItem('users'));
    const profs = users.prof || [];
    
    for (const prof of profs) {
        if (prof.classes && prof.classes.includes(eleveClasse)) {
            profEmploi = emploiDuTemps[prof.username] || getDefaultEmploiTemps();
            break;
        }
    }
    
    if (!profEmploi) {
        profEmploi = getDefaultEmploiTemps();
    }
    
    const container = document.getElementById('emploi-temps-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="emploi-temps-display">
            ${renderEmploiTemps(profEmploi)}
        </div>
    `;
}

// Rendre l'emploi du temps en HTML
function renderEmploiTemps(emploi) {
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const heures = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    
    let html = '<table class="emploi-temps-table"><thead><tr><th>Heure</th>';
    jours.forEach(jour => {
        html += `<th>${jour}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    heures.forEach(heure => {
        html += `<tr><td class="heure-cell">${heure}</td>`;
        jours.forEach(jour => {
            const cours = emploi[jour]?.[heure] || '';
            html += `<td class="cours-cell">${cours || '-'}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

// Emploi du temps par défaut
function getDefaultEmploiTemps() {
    return {
        'Lundi': {},
        'Mardi': {},
        'Mercredi': {},
        'Jeudi': {},
        'Vendredi': {}
    };
}

// Charger le profil
function loadProfil() {
    const session = getSession();
    const container = document.getElementById('profil-content');
    
    if (!container || !session) return;
    
    const eleve = session.user;
    const nameParts = eleve.name ? eleve.name.split(' ') : ['', ''];
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || eleve.name || '';
    
    container.innerHTML = `
        <div class="profil-card">
            <div class="profil-header">
                <div class="profil-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>${eleve.name || eleve.username}</h3>
            </div>
            <div class="profil-details">
                <div class="profil-item">
                    <label><i class="fas fa-user"></i> Prénom</label>
                    <span>${prenom || 'Non renseigné'}</span>
                </div>
                <div class="profil-item">
                    <label><i class="fas fa-user"></i> Nom</label>
                    <span>${nom || 'Non renseigné'}</span>
                </div>
                <div class="profil-item">
                    <label><i class="fas fa-id-card"></i> Identifiant</label>
                    <span>${eleve.username}</span>
                </div>
                <div class="profil-item">
                    <label><i class="fas fa-users"></i> Classe</label>
                    <span>${eleve.classe || 'Non assigné'}</span>
                </div>
            </div>
        </div>
    `;
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

