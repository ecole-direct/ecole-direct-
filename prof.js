// Script pour le dashboard professeur

document.addEventListener('DOMContentLoaded', () => {
    loadDevoirs();
    loadClasses();
    loadEleves();
    loadNotes();
    loadElevesClasse();
    loadEmploiTemps();
    loadAppel();
    setupDevoirModal();
    setupNoteModal();
    setupEleveClasseModal();
    setupEleveModal();
    setupEmploiTempsModal();
    setupAppel();
});

function normalizeClasse(classe) {
    if (classe === undefined || classe === null) {
        return '';
    }
    return classe.toString().trim().toUpperCase();
}

function formatClasseLabel(classe) {
    const normalized = normalizeClasse(classe);
    return normalized || 'Non assigné';
}

function getAvailableClassesFromEleves(eleves) {
    const classSet = new Set();
    let hasEmpty = false;

    eleves.forEach(eleve => {
        const normalized = normalizeClasse(eleve?.classe);
        if (normalized) {
            classSet.add(normalized);
        } else {
            hasEmpty = true;
        }
    });

    const classes = Array.from(classSet.values()).sort();
    if (hasEmpty) {
        classes.push('');
    }
    return classes;
}

function resolveProfClasses(session, availableClasses) {
    const sessionClasses = Array.isArray(session?.user?.classes) ? session.user.classes : [];
    const normalizedSessionClasses = sessionClasses
        .map(normalizeClasse)
        .filter(Boolean);
    const classesSet = new Set();

    if (normalizedSessionClasses.length === 0 && availableClasses.length === 0) {
        return [''];
    }

    if (normalizedSessionClasses.length === 0) {
        availableClasses.forEach(classe => classesSet.add(classe));
        return Array.from(classesSet.values());
    }

    normalizedSessionClasses.forEach(classe => classesSet.add(classe));
    availableClasses.forEach(classe => classesSet.add(classe));

    const result = Array.from(classesSet.values());
    return result.length > 0 ? result : [''];
}

function getEleveKey(eleve) {
    if (eleve?.id !== undefined && eleve?.id !== null) {
        return String(eleve.id);
    }
    if (eleve?.username) {
        return String(eleve.username);
    }
    return String(eleve?.name || Math.random());
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Charger les devoirs
function loadDevoirs() {
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const session = getSession();
    const container = document.getElementById('devoirs-list');
    
    if (!container) return;
    
    // Filtrer les devoirs du professeur connecté
    const profUsername = session?.user?.username;
    const profDevoirs = devoirs.filter(d => d.profId === profUsername);
    
    if (profDevoirs.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun devoir créé pour le moment.</p>';
        return;
    }
    
    container.innerHTML = profDevoirs.map((devoir) => {
        const devoirIndex = devoirs.findIndex(d => d.id === devoir.id);
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
                    <span><i class="fas fa-calendar"></i> ${formatDate(devoir.dateLimite)}</span>
                </div>
            </div>
            <div class="devoir-actions">
                <button class="btn btn-secondary" onclick="editDevoir(${devoir.id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger" onclick="deleteDevoir(${devoirIndex})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// Charger les classes
function loadClasses() {
    const session = getSession();
    const container = document.getElementById('classes-grid');
    if (!container) return;

    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleves = users.eleves || [];
    const availableClasses = getAvailableClassesFromEleves(eleves);
    const classes = resolveProfClasses(session, availableClasses);

    if (classes.length === 0 || (classes.length === 1 && classes[0] === '' && eleves.length === 0)) {
        container.innerHTML = '<p class="empty-state">Aucune classe disponible</p>';
        return;
    }

    container.innerHTML = classes.map(classe => {
        const elevesClasse = eleves.filter(e => normalizeClasse(e.classe) === classe);
        const count = elevesClasse.length;
        const label = formatClasseLabel(classe);
        const classeParam = (classe || '').replace(/'/g, "\\'");
        
        return `
        <div class="class-card">
            <div class="class-icon">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <h3>${label}</h3>
            <p>${count} élève${count > 1 ? 's' : ''}</p>
            <button class="btn btn-secondary" onclick="viewClass('${classeParam}')">
                Voir la classe
            </button>
        </div>
    `;
    }).join('');
}

// Charger les élèves
function loadEleves() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleves = users.eleves || [];
    const tbody = document.getElementById('eleves-tbody');
    
    if (!tbody) return;

    tbody.innerHTML = eleves.map(eleve => `
        <tr>
            <td>${(eleve.name || '').split(' ')[1] || ''}</td>
            <td>${(eleve.name || '').split(' ')[0] || eleve.prenom || eleve.username || ''}</td>
            <td>${formatClasseLabel(eleve.classe)}</td>
            <td>
                <button class="btn btn-sm" onclick="viewEleve(${eleve.id})">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        </tr>
    `).join('');
}

// Configuration du modal devoir
function setupDevoirModal() {
    const modal = document.getElementById('add-devoir-modal');
    const addBtn = document.getElementById('add-devoir-btn');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-devoir');
    const form = document.getElementById('add-devoir-form');
    
    if (!modal || !addBtn) {
        console.error('Éléments du modal devoir introuvables');
        return;
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            resetDevoirModal();
            modal.classList.add('active');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            resetDevoirModal();
            modal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetDevoirModal();
            modal.classList.remove('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addDevoir();
        });
    }
    
    // Fermer en cliquant en dehors
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Ajouter ou modifier un devoir
function addDevoir() {
    const session = getSession();
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const devoirIdEdit = document.getElementById('devoir-id-edit')?.value;
    
    const titre = document.getElementById('devoir-titre')?.value;
    const description = document.getElementById('devoir-description')?.value;
    const classe = document.getElementById('devoir-classe')?.value;
    const matiere = document.getElementById('devoir-matiere')?.value;
    const dateLimite = document.getElementById('devoir-date')?.value;
    
    if (!titre || !classe || !matiere || !dateLimite) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    if (devoirIdEdit) {
        // Modifier un devoir existant
        const devoirIndex = devoirs.findIndex(d => d.id == devoirIdEdit);
        if (devoirIndex !== -1) {
            devoirs[devoirIndex].titre = titre;
            devoirs[devoirIndex].description = description;
            devoirs[devoirIndex].classe = classe;
            devoirs[devoirIndex].matiere = matiere;
            devoirs[devoirIndex].dateLimite = dateLimite;
            
            localStorage.setItem('devoirs', JSON.stringify(devoirs));
            loadDevoirs();
            resetDevoirModal();
            document.getElementById('add-devoir-modal').classList.remove('active');
            showNotification('Devoir modifié avec succès !');
        }
    } else {
        // Créer un nouveau devoir
        const nouveauDevoir = {
            id: Date.now(),
            titre: titre,
            description: description,
            classe: classe,
            matiere: matiere,
            dateLimite: dateLimite,
            profId: session?.user?.username || 'prof',
            dateCreation: new Date().toISOString()
        };
        
        devoirs.push(nouveauDevoir);
        localStorage.setItem('devoirs', JSON.stringify(devoirs));
        loadDevoirs();
        resetDevoirModal();
        document.getElementById('add-devoir-modal').classList.remove('active');
        showNotification('Devoir créé avec succès !');
    }
}

// Réinitialiser le modal devoir
function resetDevoirModal() {
    const idEdit = document.getElementById('devoir-id-edit');
    const title = document.getElementById('devoir-modal-title');
    const submitBtn = document.getElementById('submit-devoir-btn');
    const form = document.getElementById('add-devoir-form');
    
    if (idEdit) idEdit.value = '';
    if (title) title.textContent = 'Ajouter un devoir';
    if (submitBtn) submitBtn.textContent = 'Créer le devoir';
    if (form) form.reset();
}

// Modifier un devoir
function editDevoir(devoirId) {
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const devoir = devoirs.find(d => d.id == devoirId);
    
    if (!devoir) {
        alert('Devoir introuvable');
        return;
    }
    
    // Remplir le formulaire avec les données du devoir
    document.getElementById('devoir-id-edit').value = devoir.id;
    document.getElementById('devoir-titre').value = devoir.titre;
    document.getElementById('devoir-description').value = devoir.description || '';
    document.getElementById('devoir-classe').value = devoir.classe;
    document.getElementById('devoir-matiere').value = devoir.matiere;
    document.getElementById('devoir-date').value = devoir.dateLimite;
    
    // Changer le titre du modal et le bouton
    document.getElementById('devoir-modal-title').textContent = 'Modifier le devoir';
    document.getElementById('submit-devoir-btn').textContent = 'Enregistrer les modifications';
    
    // Ouvrir le modal
    document.getElementById('add-devoir-modal').classList.add('active');
}

// Supprimer un devoir
function deleteDevoir(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) return;
    
    const devoirs = JSON.parse(localStorage.getItem('devoirs')) || [];
    const session = getSession();
    const profDevoirs = devoirs.filter(d => d.profId === session?.user?.username || !d.profId);
    
    if (index >= 0 && index < profDevoirs.length) {
        const devoirToDelete = profDevoirs[index];
        const devoirIndex = devoirs.findIndex(d => d.id === devoirToDelete.id);
        if (devoirIndex !== -1) {
            devoirs.splice(devoirIndex, 1);
            localStorage.setItem('devoirs', JSON.stringify(devoirs));
            loadDevoirs();
            showNotification('Devoir supprimé.');
        }
    }
}

// Voir une classe
function viewClass(classe) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleves = users.eleves || [];
    const normalizedClasse = normalizeClasse(classe);
    const classeLabel = formatClasseLabel(classe);

    const classeEleves = eleves.filter(eleve => {
        return normalizeClasse(eleve.classe) === normalizedClasse;
    });

    const modal = document.getElementById('class-details-modal');
    const titleEl = document.getElementById('class-details-title');
    const bodyEl = document.getElementById('class-details-body');

    if (!modal || !titleEl || !bodyEl) {
        console.warn('Modal détails classe indisponible');
        return;
    }

    titleEl.textContent = normalizedClasse ? `Classe ${classeLabel}` : 'Élèves non assignés';

    if (classeEleves.length === 0) {
        bodyEl.innerHTML = '<p class="empty-state">Aucun élève dans cette classe.</p>';
    } else {
        bodyEl.innerHTML = classeEleves.map(eleve => {
            const prenom = eleve.prenom || (eleve.name || '').split(' ')[0] || eleve.username || 'Élève';
            const identifiant = eleve.username || '';
            const motdepasse = eleve.password || 'N/A';
            const photo = eleve.photo
                ? `<img src="${escapeHtml(eleve.photo)}" alt="${escapeHtml(prenom)}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
                : `<div style="width: 60px; height: 60px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(prenom.charAt(0).toUpperCase())}</div>`;
            const qrCodeData = eleve.id || eleve.username || (eleve.prenom || eleve.name || '').toLowerCase();

            return `
                <div class="class-eleve-card" style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border-radius: 12px; padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        ${photo}
                        <div>
                            <h4 style="margin: 0;">${escapeHtml(prenom)}</h4>
                            <p style="margin: 0.2rem 0 0; color: #64748b;">Identifiant : <strong>${escapeHtml(identifiant)}</strong></p>
                            <p style="margin: 0.2rem 0 0; color: #64748b;">Mot de passe : <code style="background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px;">${escapeHtml(motdepasse)}</code></p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <button class="btn btn-sm btn-success" onclick="downloadQRCode('${qrCodeData}', '${escapeHtml(prenom)}')" title="Télécharger le QR code">
                            <i class="fas fa-qrcode"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.classList.add('active');
}

// Voir un élève
function viewEleve(id) {
    const users = JSON.parse(localStorage.getItem('users'));
    const eleve = users.eleves.find(e => e.id === id);
    if (eleve) {
        alert(`Profil de ${eleve.name}\nClasse: ${eleve.classe}\n\nCette fonctionnalité sera disponible prochainement.`);
    }
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

// Charger les notes
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const session = getSession();
    const container = document.getElementById('notes-content');
    
    if (!container) return;
    
    const profNotes = notes.filter(n => n.profId === session?.user?.username || !n.profId);
    
    if (profNotes.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune note ajoutée pour le moment.</p>';
        return;
    }
    
    const notesParEleve = {};
    profNotes.forEach(note => {
        const eleveId = note.eleveId;
        if (!notesParEleve[eleveId]) {
            notesParEleve[eleveId] = [];
        }
        notesParEleve[eleveId].push(note);
    });
    
    container.innerHTML = Object.entries(notesParEleve).map(([eleveId, notesEleve]) => {
        const users = JSON.parse(localStorage.getItem('users'));
        const eleve = users.eleves.find(e => e.id == eleveId);
        const eleveName = eleve ? eleve.name : `Élève #${eleveId}`;
        
        return `
            <div class="note-card-prof">
                <div class="note-card-header"><h3>${eleveName}</h3></div>
                <div class="note-card-details">
                    ${notesEleve.map((note, index) => `
                        <div class="note-item-prof">
                            <div class="note-info">
                                <span><strong>${note.matiere}</strong> - ${note.devoir || 'Devoir'}</span>
                                <span class="note-value">${note.note}/20</span>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="deleteNote(${eleveId}, ${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Configuration du modal notes
function setupNoteModal() {
    const modal = document.getElementById('add-note-modal');
    const addBtn = document.getElementById('add-note-btn');
    const form = document.getElementById('add-note-form');
    const eleveSelect = document.getElementById('note-eleve');
    
    if (eleveSelect) {
        const users = JSON.parse(localStorage.getItem('users'));
        const eleves = users.eleves || [];
        eleveSelect.innerHTML = '<option value="">Sélectionner un élève</option>' + 
            eleves.map(eleve => 
                `<option value="${eleve.id}">${eleve.name} (${eleve.classe || 'Non assigné'})</option>`
            ).join('');
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addNote();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Ajouter une note
function addNote() {
    const session = getSession();
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    
    const nouvelleNote = {
        id: Date.now(),
        eleveId: parseInt(document.getElementById('note-eleve').value),
        matiere: document.getElementById('note-matiere').value,
        devoir: document.getElementById('note-devoir').value || 'Devoir',
        note: parseFloat(document.getElementById('note-valeur').value),
        profId: session?.user?.username || 'prof',
        date: new Date().toISOString()
    };
    
    notes.push(nouvelleNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    closeNoteModal();
    showNotification('Note ajoutée avec succès !');
}

// Supprimer une note
function deleteNote(eleveId, index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const notesEleve = notes.filter(n => n.eleveId == eleveId);
    const noteToDelete = notesEleve[index];
    
    if (noteToDelete) {
        const noteIndex = notes.findIndex(n => n.id === noteToDelete.id);
        if (noteIndex !== -1) {
            notes.splice(noteIndex, 1);
            localStorage.setItem('notes', JSON.stringify(notes));
            loadNotes();
            showNotification('Note supprimée.');
        }
    }
}

// Charger les élèves pour gestion classe
function loadElevesClasse() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleves = users.eleves || [];
    const container = document.getElementById('eleves-classe-container');
    if (!container) return;

    if (eleves.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun élève enregistré pour le moment.</p>';
        return;
    }

    const elevesSorted = [...eleves].sort((a, b) => {
        const nameA = (a.prenom || a.name || a.username || '').toLowerCase();
        const nameB = (b.prenom || b.name || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
    });

    const tableRows = elevesSorted.map(eleve => {
        const prenom = eleve.prenom || (eleve.name || '').split(' ')[0] || eleve.username || 'Élève';
        const classeLabel = formatClasseLabel(eleve.classe);
        const photo = eleve.photo
            ? `<img src="${escapeHtml(eleve.photo)}" alt="${escapeHtml(prenom)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`
            : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(prenom.charAt(0).toUpperCase())}</div>`;
        const qrCodeData = eleve.id || eleve.username || (eleve.prenom || eleve.name || '').toLowerCase();
        const eleveKey = getEleveKey(eleve);

        return `
            <tr>
                <td>${photo}</td>
                <td>${escapeHtml(prenom)}</td>
                <td>${escapeHtml(classeLabel)}</td>
                <td>${escapeHtml(eleve.username || '')}</td>
                <td><code style="background: #f0f0f0; padding: 0.3rem 0.5rem; border-radius: 4px; font-family: monospace;">${escapeHtml(eleve.password || 'N/A')}</code></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="downloadQRCode('${qrCodeData}', '${escapeHtml(prenom)}')" title="Télécharger QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeEleveFromClasse('${escapeHtml(eleveKey)}')">
                        <i class="fas fa-times"></i> Retirer de la classe
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div class="users-table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Photo</th>
                        <th>Prénom</th>
                        <th>Classe</th>
                        <th>Identifiant</th>
                        <th>Mot de passe</th>
                        <th>QR Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    const classes = getAvailableClassesFromEleves(eleves);
    const classesHtml = classes.map(classe => {
        const elevesClasse = eleves.filter(e => normalizeClasse(e.classe) === classe);
        const label = formatClasseLabel(classe);

        return `
        <div class="classe-eleves-card">
            <h3>${label}</h3>
            <div class="eleves-list-classe">
                ${elevesClasse.length > 0 ?
                    elevesClasse.map(eleve => `
                        <div class="eleve-item-classe">
                            <span>${escapeHtml(eleve.name || eleve.username)}</span>
                            <button class="btn btn-sm btn-danger" onclick="removeEleveFromClasse('${escapeHtml(getEleveKey(eleve))}')">
                                <i class="fas fa-times"></i> Retirer
                            </button>
                        </div>
                    `).join('') :
                    '<p class="empty-state">Aucun élève dans cette classe</p>'
                }
            </div>
        </div>
    `;
    }).join('');

    container.innerHTML = `
        ${tableHtml}
        <div class="classes-summary-grid">
            ${classesHtml}
        </div>
    `;
}

// Configuration du modal ajouter élève à classe
function setupEleveClasseModal() {
    const modal = document.getElementById('add-eleve-classe-modal');
    const addBtn = document.getElementById('add-eleve-classe-btn');
    const form = document.getElementById('add-eleve-classe-form');
    const eleveSelect = document.getElementById('eleve-classe-select');
    const classeSelect = document.getElementById('eleve-classe-nom');
    
    if (eleveSelect) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const eleves = users.eleves || [];
        eleveSelect.innerHTML = '<option value="">Sélectionner un élève</option>' + 
            eleves.map(eleve => 
                `<option value="${getEleveKey(eleve)}">${eleve.name}${eleve.classe ? ' (' + formatClasseLabel(eleve.classe) + ')' : ''}</option>`
            ).join('');
    }
    
    if (classeSelect) {
        const session = getSession();
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const eleves = users.eleves || [];
        const availableClasses = getAvailableClassesFromEleves(eleves);
        const sessionClasses = Array.isArray(session?.user?.classes) ? session.user.classes.map(normalizeClasse) : [];
        const classesSet = new Set([
            ...availableClasses.filter(Boolean),
            ...sessionClasses.filter(Boolean)
        ]);

        classeSelect.innerHTML = '<option value="">Sélectionner une classe</option>' + 
            Array.from(classesSet.values()).map(classe => `<option value="${classe}">${classe}</option>`).join('');
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addEleveToClasse();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Ajouter un élève à une classe
function addEleveToClasse() {
    const eleveSelect = document.getElementById('eleve-classe-select');
    const classeSelect = document.getElementById('eleve-classe-nom');

    if (!eleveSelect || !classeSelect) return;

    const eleveId = eleveSelect.value;
    const classe = normalizeClasse(classeSelect.value);

    if (!eleveId || !classe) {
        alert('Veuillez sélectionner un élève et une classe.');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleve = (users.eleves || []).find(e => getEleveKey(e) === eleveId);
    
    if (eleve) {
        eleve.classe = classe;
        localStorage.setItem('users', JSON.stringify(users));
        loadElevesClasse();
        closeEleveClasseModal();
        showNotification(`Élève ajouté à la classe ${classe} !`);
    }
}

// Retirer un élève d'une classe
function removeEleveFromClasse(eleveId) {
    if (!confirm('Retirer cet élève de sa classe ?')) return;
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const eleve = (users.eleves || []).find(e => getEleveKey(e) === String(eleveId));
    
    if (eleve) {
        eleve.classe = '';
        localStorage.setItem('users', JSON.stringify(users));
        loadElevesClasse();
        showNotification('Élève retiré de la classe.');
    }
}

// Fermer les modals
function closeNoteModal() {
    document.getElementById('add-note-modal').classList.remove('active');
    document.getElementById('add-note-form').reset();
}

function closeEleveClasseModal() {
    document.getElementById('add-eleve-classe-modal').classList.remove('active');
    document.getElementById('add-eleve-classe-form').reset();
}

// Exposer les fonctions globalement pour les onclick
window.deleteDevoir = deleteDevoir;
window.viewClass = viewClass;
window.viewEleve = viewEleve;
window.deleteNote = deleteNote;
window.removeEleveFromClasse = removeEleveFromClasse;
window.closeNoteModal = closeNoteModal;
window.closeEleveClasseModal = closeEleveClasseModal;

// Configuration du modal créer nouvel élève
function setupEleveModal() {
    const modal = document.getElementById('add-eleve-modal');
    const addBtn = document.getElementById('add-eleve-btn');
    const form = document.getElementById('add-eleve-form');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addEleve();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Créer un nouvel élève
function addEleve() {
    const prenom = document.getElementById('eleve-prenom').value.trim();
    const nom = document.getElementById('eleve-nom').value.trim();
    const username = document.getElementById('eleve-username').value.trim();
    const password = document.getElementById('eleve-password').value;
    const classe = normalizeClasse(document.getElementById('eleve-classe-new').value);
    
    if (!prenom || !nom || !username || !password) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const eleves = users.eleves || [];
    
    // Vérifier si l'identifiant existe déjà
    if (eleves.find(e => e.username === username)) {
        alert('Cet identifiant existe déjà. Veuillez en choisir un autre.');
        return;
    }
    
    // Générer un ID unique
    const maxId = eleves.length > 0 ? Math.max(...eleves.map(e => e.id || 0)) : 0;
    const newId = maxId + 1;
    
    // Créer le nouvel élève
    const nouvelEleve = {
        id: newId,
        username: username,
        password: password,
        name: `${prenom} ${nom}`,
        classe: classe || ''
    };
    
    eleves.push(nouvelEleve);
    users.eleves = eleves;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Recharger les listes
    loadEleves();
    loadElevesClasse();
    
    // Fermer le modal et réinitialiser le formulaire
    closeEleveModal();
    showNotification(`Élève ${prenom} ${nom} créé avec succès !`);
}

// Fermer le modal élève
function closeEleveModal() {
    const modal = document.getElementById('add-eleve-modal');
    const form = document.getElementById('add-eleve-form');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

// Charger l'emploi du temps
function loadEmploiTemps() {
    const session = getSession();
    const profId = session?.user?.username || 'prof';
    const emploiDuTemps = JSON.parse(localStorage.getItem('emploiDuTemps')) || {};
    const profEmploi = emploiDuTemps[profId] || getDefaultEmploiTemps();
    
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

// Configuration du modal emploi du temps
function setupEmploiTempsModal() {
    const modal = document.getElementById('edit-emploi-temps-modal');
    const editBtn = document.getElementById('edit-emploi-temps-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            openEmploiTempsModal();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEmploiTempsModal();
            }
        });
    }
}

// Ouvrir le modal emploi du temps
function openEmploiTempsModal() {
    const session = getSession();
    const profId = session?.user?.username || 'prof';
    const emploiDuTemps = JSON.parse(localStorage.getItem('emploiDuTemps')) || {};
    const profEmploi = emploiDuTemps[profId] || getDefaultEmploiTemps();
    
    const editor = document.getElementById('emploi-temps-editor');
    if (!editor) return;
    
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const heures = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    
    let html = '<table class="emploi-temps-editor-table"><thead><tr><th>Heure</th>';
    jours.forEach(jour => {
        html += `<th>${jour}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    heures.forEach(heure => {
        html += `<tr><td class="heure-cell">${heure}</td>`;
        jours.forEach(jour => {
            const cours = profEmploi[jour]?.[heure] || '';
            html += `<td class="cours-cell-edit">
                <input type="text" 
                       data-jour="${jour}" 
                       data-heure="${heure}" 
                       value="${cours}" 
                       placeholder="Matière / Classe">
            </td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    editor.innerHTML = html;
    
    const modal = document.getElementById('edit-emploi-temps-modal');
    if (modal) modal.classList.add('active');
}

// Sauvegarder l'emploi du temps
function saveEmploiTemps() {
    const session = getSession();
    const profId = session?.user?.username || 'prof';
    const emploiDuTemps = JSON.parse(localStorage.getItem('emploiDuTemps')) || {};
    
    const inputs = document.querySelectorAll('#emploi-temps-editor input[data-jour]');
    const profEmploi = getDefaultEmploiTemps();
    
    inputs.forEach(input => {
        const jour = input.dataset.jour;
        const heure = input.dataset.heure;
        const cours = input.value.trim();
        
        if (cours) {
            if (!profEmploi[jour]) {
                profEmploi[jour] = {};
            }
            profEmploi[jour][heure] = cours;
        }
    });
    
    emploiDuTemps[profId] = profEmploi;
    localStorage.setItem('emploiDuTemps', JSON.stringify(emploiDuTemps));
    
    loadEmploiTemps();
    closeEmploiTempsModal();
    showNotification('Emploi du temps enregistré avec succès !');
}

// Fermer le modal emploi du temps
function closeEmploiTempsModal() {
    const modal = document.getElementById('edit-emploi-temps-modal');
    if (modal) modal.classList.remove('active');
}

// ==================== GESTION DE L'APPEL ====================

let appelData = {};
let qrStream = null;

// Charger l'appel
function loadAppel() {
    const session = getSession();
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const eleves = users.eleves || [];
    const availableClasses = getAvailableClassesFromEleves(eleves);
    const profClasses = resolveProfClasses(session, availableClasses);
    
    const profEleves = eleves.filter(e => {
        const classeNorm = normalizeClasse(e.classe);
        if (profClasses.length === 0) {
            return true;
        }
        if (classeNorm === '' && profClasses.includes('')) {
            return true;
        }
        return profClasses.includes(classeNorm);
    });
    
    const appelList = document.getElementById('appel-list');
    const appelDate = document.getElementById('appel-date');
    const appelStatusText = document.getElementById('appel-status-text');
    const saveBtn = document.getElementById('save-appel-btn');
    
    if (!appelList) return;
    
    // Afficher la date
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    if (appelDate) appelDate.textContent = dateStr;
    
    // Vérifier si l'appel a déjà été fait aujourd'hui
    const appels = JSON.parse(localStorage.getItem('appels') || '[]');
    const todayStr = today.toISOString().split('T')[0];
    const todayAppel = appels.find(a => a.date === todayStr && a.profId === session?.user?.username);
    
    if (todayAppel) {
        if (appelStatusText) {
            appelStatusText.innerHTML = '<span style="color: green;">✓ Appel déjà fait aujourd\'hui</span>';
        }
        if (saveBtn) saveBtn.style.display = 'none';
        
        // Afficher l'appel du jour
        appelList.innerHTML = todayAppel.students.map(student => {
            const eleve = profEleves.find(e => (e.prenom === student.name || e.name === student.name));
            const photo = eleve?.photo ? `<img src="${eleve.photo}" alt="${student.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold;">${(student.name || '').charAt(0).toUpperCase()}</div>`;
            const classeLabel = formatClasseLabel(student.classe || eleve?.classe);
            
            return `
                <div class="appel-item-card" style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center;">
                        ${photo}
                        <div>
                            <strong>${student.name}</strong>
                            <div style="color: #666; font-size: 0.9em;">${classeLabel}</div>
                        </div>
                    </div>
                    <span class="status-badge ${student.status}" style="padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">
                        ${student.status === 'present' ? 'Présent' : student.status === 'retard' ? 'En retard' : 'Absent'}
                    </span>
                </div>
            `;
        }).join('');
        return;
    }
    
    if (appelStatusText) {
        appelStatusText.innerHTML = '<span style="color: orange;">⚠ Appel à faire</span>';
    }
    
    if (profEleves.length === 0) {
        appelList.innerHTML = '<p class="empty-state">Aucun élève dans vos classes</p>';
        return;
    }
    
    // Créer la liste d'appel avec les boutons
    appelList.innerHTML = profEleves.map((eleve, index) => {
        const eleveKey = getEleveKey(eleve);
        const escapedKey = eleveKey.replace(/'/g, "\\'");
        const photo = eleve.photo ? `<img src="${eleve.photo}" alt="${eleve.prenom || eleve.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold;">${(eleve.prenom || eleve.name || '').charAt(0).toUpperCase()}</div>`;
        
        return `
            <div class="appel-item-card" data-eleve-id="${eleveKey}" style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        ${photo}
                        <div>
                            <strong>${eleve.prenom || eleve.name}</strong>
                            <div style="color: #666; font-size: 0.9em;">${formatClasseLabel(eleve.classe)}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-success appel-btn" data-eleve="${eleveKey}" data-status="present" onclick="setAppelStatus('${escapedKey}', 'present')" style="padding: 0.5rem 1rem; font-size: 0.9em;">
                            <i class="fas fa-check"></i> Présent
                        </button>
                        <button class="btn btn-warning appel-btn" data-eleve="${eleveKey}" data-status="retard" onclick="setAppelStatus('${escapedKey}', 'retard')" style="padding: 0.5rem 1rem; font-size: 0.9em; background: #f59e0b; color: white;">
                            <i class="fas fa-clock"></i> Retard
                        </button>
                        <button class="btn btn-danger appel-btn" data-eleve="${eleveKey}" data-status="absent" onclick="setAppelStatus('${escapedKey}', 'absent')" style="padding: 0.5rem 1rem; font-size: 0.9em;">
                            <i class="fas fa-times"></i> Absent
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Configurer l'appel
function setupAppel() {
    const scanBtn = document.getElementById('scan-qr-btn');
    const saveBtn = document.getElementById('save-appel-btn');
    
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            document.getElementById('scan-qr-modal').classList.add('active');
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAppelProf);
    }
}

// Définir le statut d'un élève dans l'appel
function setAppelStatus(eleveId, status) {
    const session = getSession();
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const eleves = users.eleves || [];
    const eleveIdString = String(eleveId);
    const eleve = eleves.find(e => getEleveKey(e) === eleveIdString);
    
    if (!eleve) return;
    
    appelData[eleveIdString] = status;
    
    // Mettre à jour l'affichage
    const item = document.querySelector(`.appel-item-card[data-eleve-id="${eleveIdString}"]`);
    if (item) {
        const buttons = item.querySelectorAll('.appel-btn');
        buttons.forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.transform = 'scale(0.95)';
            btn.style.boxShadow = 'none';
        });
        
        // Mettre en évidence le bouton sélectionné
        const selectedBtn = item.querySelector(`.appel-btn[data-status="${status}"]`);
        if (selectedBtn) {
            selectedBtn.style.opacity = '1';
            selectedBtn.style.transform = 'scale(1.05)';
            selectedBtn.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        }
    }
    
    // Afficher le bouton d'enregistrement
    const saveBtn = document.getElementById('save-appel-btn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
    }
}

// Enregistrer l'appel
function saveAppelProf() {
    const session = getSession();
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const eleves = users.eleves || [];
    const availableClasses = getAvailableClassesFromEleves(eleves);
    const profClasses = resolveProfClasses(session, availableClasses);
    const profEleves = eleves.filter(e => {
        const classeNorm = normalizeClasse(e.classe);
        if (profClasses.length === 0) {
            return true;
        }
        if (classeNorm === '' && profClasses.includes('')) {
            return true;
        }
        return profClasses.includes(classeNorm);
    });
    
    // Vérifier si tous les élèves ont un statut
    const allHaveStatus = profEleves.every(e => appelData[getEleveKey(e)]);
    
    if (!allHaveStatus) {
        alert('Veuillez définir le statut de tous les élèves');
        return;
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const appels = JSON.parse(localStorage.getItem('appels') || '[]');
    
    // Vérifier si l'appel a déjà été fait
    if (appels.some(a => a.date === todayStr && a.profId === session?.user?.username)) {
        alert('L\'appel a déjà été fait aujourd\'hui');
        return;
    }
    
    const appel = {
        date: todayStr,
        profId: session?.user?.username || 'alexiag',
        students: profEleves.map(eleve => ({
            name: eleve.prenom || eleve.name,
            classe: formatClasseLabel(eleve.classe),
            status: appelData[getEleveKey(eleve)] || 'absent'
        }))
    };
    
    appels.push(appel);
    localStorage.setItem('appels', JSON.stringify(appels));
    
    appelData = {};
    loadAppel();
    alert('Appel enregistré avec succès !');
}

// Scanner QR Code
function startQRScanner() {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const statusDiv = document.getElementById('qr-status');
    const resultDiv = document.getElementById('qr-result');
    
    if (!video || !canvas) return;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            qrStream = stream;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.style.display = 'block';
            statusDiv.style.display = 'none';
            
            video.play();
            
            function scanQR() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (typeof jsQR !== 'undefined') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code) {
                            // QR Code détecté
                            processQRCode(code.data);
                            stopQRScanner();
                            return;
                        }
                    }
                }
                
                requestAnimationFrame(scanQR);
            }
            
            scanQR();
        })
        .catch(err => {
            console.error('Erreur caméra:', err);
            alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        });
}

// Traiter le QR code scanné
function processQRCode(qrData) {
    try {
        // Le QR code devrait contenir l'ID ou le username de l'élève
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const eleves = users.eleves || [];
        const session = getSession();
        const availableClasses = getAvailableClassesFromEleves(eleves);
        const profClasses = resolveProfClasses(session, availableClasses);
        
        // Chercher l'élève par ID, username ou prénom dans le QR code
        const eleve = eleves.find(e => {
            const qrLower = qrData.toLowerCase().trim();
            const eleveId = String(e.id || '').toLowerCase();
            const eleveUsername = (e.username || '').toLowerCase();
            const elevePrenom = (e.prenom || e.name || '').toLowerCase();
            
            return qrLower === eleveId || qrLower === eleveUsername || qrLower === elevePrenom;
        });
        
        if (eleve) {
            const classeNorm = normalizeClasse(eleve.classe);
            const autorise = profClasses.length === 0
                || profClasses.includes(classeNorm)
                || (classeNorm === '' && profClasses.includes(''));

            if (!autorise) {
                throw new Error('Élève non autorisé pour vos classes.');
            }

            // Marquer l'élève comme présent
            const eleveKey = getEleveKey(eleve);
            setAppelStatus(eleveKey, 'present');
            
            // Afficher le résultat
            const resultDiv = document.getElementById('qr-result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="background: #ecfdf5; color: #047857; padding: 1rem; border-radius: 8px; border: 1px solid #10b981;">
                        <strong>Présence enregistrée :</strong>
                        <p style="margin: 0.5rem 0 0;">${eleve.prenom || eleve.name} (${formatClasseLabel(eleve.classe)})</p>
                    </div>
                `;
            }
            
            // Fermer le modal après 2 secondes
            setTimeout(() => {
                closeScanQRModal();
            }, 2000);
        } else {
            throw new Error('Élève introuvable.');
        }
    } catch (e) {
        console.error('Erreur traitement QR code:', e);
        const resultDiv = document.getElementById('qr-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="background: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 8px; border: 1px solid #f87171;">
                    <strong>Erreur :</strong>
                    <p style="margin: 0.5rem 0 0;">${e.message || 'Erreur lors du traitement du QR code.'}</p>
                </div>
            `;
        } else {
            alert('Erreur lors du traitement du QR code');
        }
    }
}

// Arrêter le scanner
function stopQRScanner() {
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    const video = document.getElementById('qr-video');
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
}

// Fermer le modal scanner
function closeScanQRModal() {
    stopQRScanner();
    const modal = document.getElementById('scan-qr-modal');
    if (modal) modal.classList.remove('active');
    
    const resultDiv = document.getElementById('qr-result');
    if (resultDiv) resultDiv.style.display = 'none';
    
    const statusDiv = document.getElementById('qr-status');
    if (statusDiv) statusDiv.style.display = 'block';
}

function closeClassDetailsModal() {
    const modal = document.getElementById('class-details-modal');
    if (modal) modal.classList.remove('active');
}

// Générer et télécharger un QR code (professeur)
function downloadQRCode(data, prenom) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QRCode_${prenom}_${data}.png`;
    link.click();
}

// Exposer les nouvelles fonctions globalement
window.closeEleveModal = closeEleveModal;
window.saveEmploiTemps = saveEmploiTemps;
window.setAppelStatus = setAppelStatus;
window.startQRScanner = startQRScanner;
window.closeScanQRModal = closeScanQRModal;
window.closeEmploiTempsModal = closeEmploiTempsModal;
window.editDevoir = editDevoir;
window.downloadQRCode = downloadQRCode;
window.closeClassDetailsModal = closeClassDetailsModal;
