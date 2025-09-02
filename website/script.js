// Data Management
class MatchTracker {
    constructor() {
        this.matches = this.loadMatches();
        this.savedPlayers = this.loadSavedPlayers();
        this.currentPlayers = [];
        this.editingMatchId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePlayerSelect();
        this.updateSeasonStats();
        this.updateMatchesList();
        this.setTodayDate();
    }

    // Data Persistence
    loadMatches() {
        const stored = localStorage.getItem('kampong-matches');
        return stored ? JSON.parse(stored) : [];
    }

    saveMatches() {
        localStorage.setItem('kampong-matches', JSON.stringify(this.matches));
    }

    loadSavedPlayers() {
        const stored = localStorage.getItem('kampong-saved-players');
        return stored ? JSON.parse(stored) : [];
    }

    saveSavedPlayers() {
        localStorage.setItem('kampong-saved-players', JSON.stringify(this.savedPlayers));
    }

    // Event Listeners
    setupEventListeners() {
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.addPlayer());
        document.getElementById('saveMatchBtn').addEventListener('click', () => this.saveMatch());
        document.getElementById('managePlayersBtn').addEventListener('click', () => this.openPlayerModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closePlayerModal());
        document.getElementById('modalOverlay').addEventListener('click', () => this.closePlayerModal());
        
        // Enter key support
        document.getElementById('newPlayerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('matchDate').value = today;
    }

    // Player Management
    addPlayer() {
        const select = document.getElementById('playerSelect');
        const newNameInput = document.getElementById('newPlayerName');
        
        let playerName = select.value || newNameInput.value.trim();
        
        if (!playerName) return;
        
        // Add to saved players if new
        if (!this.savedPlayers.find(p => p.name === playerName)) {
            this.savedPlayers.push({ id: Date.now(), name: playerName });
            this.saveSavedPlayers();
            this.updatePlayerSelect();
        }
        
        // Add to current match if not already added
        if (!this.currentPlayers.find(p => p.name === playerName)) {
            this.currentPlayers.push({
                name: playerName,
                goals: 0,
                assists: 0,
                isMotm: false
            });
            this.updateCurrentPlayersDisplay();
        }
        
        // Reset inputs
        select.value = '';
        newNameInput.value = '';
    }

    removePlayer(playerName) {
        this.currentPlayers = this.currentPlayers.filter(p => p.name !== playerName);
        this.updateCurrentPlayersDisplay();
    }

    updatePlayerGoals(playerName, goals) {
        const player = this.currentPlayers.find(p => p.name === playerName);
        if (player) {
            player.goals = Math.max(0, parseInt(goals) || 0);
        }
    }

    updatePlayerAssists(playerName, assists) {
        const player = this.currentPlayers.find(p => p.name === playerName);
        if (player) {
            player.assists = Math.max(0, parseInt(assists) || 0);
        }
    }

    toggleMotm(playerName) {
        this.currentPlayers.forEach(p => {
            p.isMotm = p.name === playerName ? !p.isMotm : false;
        });
        this.updateCurrentPlayersDisplay();
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        select.innerHTML = '<option value="">Kies speler...</option>';
        
        this.savedPlayers.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            select.appendChild(option);
        });
    }

    // Display Updates
    updateCurrentPlayersDisplay() {
        const container = document.getElementById('currentPlayers');
        
        if (this.currentPlayers.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Geen spelers toegevoegd</p>';
            return;
        }
        
        container.innerHTML = this.currentPlayers.map(player => `
            <div class="player-card ${player.isMotm ? 'motm' : ''}">
                <span class="player-name">${player.name}</span>
                <div class="player-stats">
                    <span>Goals:</span>
                    <input type="number" class="stat-input" min="0" value="${player.goals}" 
                           onchange="tracker.updatePlayerGoals('${player.name}', this.value)">
                </div>
                <div class="player-stats">
                    <span>Assists:</span>
                    <input type="number" class="stat-input" min="0" value="${player.assists}"
                           onchange="tracker.updatePlayerAssists('${player.name}', this.value)">
                </div>
                <button class="motm-btn ${player.isMotm ? 'active' : ''}" 
                        onclick="tracker.toggleMotm('${player.name}')">
                    ${player.isMotm ? '⭐ MOTM' : 'MOTM'}
                </button>
                <button class="remove-btn" onclick="tracker.removePlayer('${player.name}')">
                    Verwijder
                </button>
            </div>
        `).join('');
    }

    // Match Management
    saveMatch() {
        const opponent = document.getElementById('opponent').value.trim();
        const date = document.getElementById('matchDate').value;
        const score = document.getElementById('score').value.trim();
        const homeAway = document.getElementById('homeAway').value;
        
        if (!opponent || !date || !score) {
            alert('Vul alle vereiste velden in (Tegenstander, Datum, Uitslag)');
            return;
        }
        
        const match = {
            id: this.editingMatchId || Date.now(),
            opponent,
            date,
            score,
            homeAway,
            players: [...this.currentPlayers]
        };
        
        if (this.editingMatchId) {
            const index = this.matches.findIndex(m => m.id === this.editingMatchId);
            this.matches[index] = match;
            this.editingMatchId = null;
            document.getElementById('saveMatchBtn').textContent = 'Wedstrijd Opslaan';
        } else {
            this.matches.unshift(match);
        }
        
        this.saveMatches();
        this.clearForm();
        this.updateSeasonStats();
        this.updateMatchesList();
    }

    editMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;
        
        document.getElementById('opponent').value = match.opponent;
        document.getElementById('matchDate').value = match.date;
        document.getElementById('score').value = match.score;
        document.getElementById('homeAway').value = match.homeAway;
        
        this.currentPlayers = [...match.players];
        this.editingMatchId = matchId;
        this.updateCurrentPlayersDisplay();
        document.getElementById('saveMatchBtn').textContent = 'Wedstrijd Bijwerken';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteMatch(matchId) {
        if (confirm('Weet je zeker dat je deze wedstrijd wilt verwijderen?')) {
            this.matches = this.matches.filter(m => m.id !== matchId);
            this.saveMatches();
            this.updateSeasonStats();
            this.updateMatchesList();
        }
    }

    clearForm() {
        document.getElementById('opponent').value = '';
        document.getElementById('score').value = '';
        document.getElementById('homeAway').value = 'thuis';
        this.currentPlayers = [];
        this.updateCurrentPlayersDisplay();
        this.setTodayDate();
    }

    // Statistics
    updateSeasonStats() {
        const playerStats = {};
        
        this.matches.forEach(match => {
            match.players.forEach(player => {
                if (!playerStats[player.name]) {
                    playerStats[player.name] = { goals: 0, assists: 0, motm: 0, total: 0 };
                }
                playerStats[player.name].goals += player.goals;
                playerStats[player.name].assists += player.assists;
                if (player.isMotm) playerStats[player.name].motm += 1;
                playerStats[player.name].total = playerStats[player.name].goals + 
                                                playerStats[player.name].assists + 
                                                playerStats[player.name].motm;
            });
        });
        
        const sortedStats = Object.entries(playerStats)
            .sort((a, b) => b[1].total - a[1].total);
        
        const container = document.getElementById('playerStats');
        
        if (sortedStats.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Nog geen statistieken beschikbaar</p>';
            return;
        }
        
        container.innerHTML = sortedStats.map(([name, stats]) => `
            <div class="stat-card">
                <span class="stat-name">${name}</span>
                <span class="stat-value">${stats.goals} ⚽</span>
                <span class="stat-value">${stats.assists} 🅰️</span>
                <span class="stat-value">${stats.motm} ⭐</span>
                <span class="stat-value"><strong>${stats.total}</strong></span>
            </div>
        `).join('');
    }

    updateMatchesList() {
        const container = document.getElementById('matchesList');
        
        if (this.matches.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Nog geen wedstrijden gespeeld</p>';
            return;
        }
        
        container.innerHTML = this.matches.map(match => `
            <div class="match-card">
                <div class="match-header">
                    <div class="match-info">
                        <h3>${match.opponent} - ${match.score}</h3>
                        <div class="match-details">
                            ${new Date(match.date).toLocaleDateString('nl-NL')} • ${match.homeAway === 'thuis' ? 'Thuis' : 'Uit'}
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="btn-secondary" onclick="tracker.editMatch(${match.id})">Bewerken</button>
                        <button class="btn-danger" onclick="tracker.deleteMatch(${match.id})">Verwijderen</button>
                    </div>
                </div>
                <div class="match-players">
                    ${match.players.map(player => `
                        <div class="match-player ${player.isMotm ? 'motm' : ''}">
                            <span class="player-name">${player.name} ${player.isMotm ? '⭐' : ''}</span>
                            <div class="match-player-stats">
                                <span>${player.goals} Goals</span>
                                <span>${player.assists} Assists</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Player Modal
    openPlayerModal() {
        document.getElementById('playerModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        this.updateSavedPlayersList();
        document.body.style.overflow = 'hidden';
    }

    closePlayerModal() {
        document.getElementById('playerModal').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    updateSavedPlayersList() {
        const container = document.getElementById('savedPlayersList');
        
        if (this.savedPlayers.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Geen spelers opgeslagen</p>';
            return;
        }
        
        container.innerHTML = this.savedPlayers.map(player => `
            <div class="saved-player-item">
                <input type="text" class="saved-player-name" value="${player.name}" 
                       onblur="tracker.updatePlayerName(${player.id}, this.value)">
                <button class="btn-danger" onclick="tracker.deleteSavedPlayer(${player.id})">Verwijderen</button>
            </div>
        `).join('');
    }

    updatePlayerName(playerId, newName) {
        const player = this.savedPlayers.find(p => p.id === playerId);
        if (player && newName.trim()) {
            const oldName = player.name;
            player.name = newName.trim();
            this.saveSavedPlayers();
            this.updatePlayerSelect();
            
            // Update name in matches
            this.matches.forEach(match => {
                match.players.forEach(p => {
                    if (p.name === oldName) {
                        p.name = newName.trim();
                    }
                });
            });
            this.saveMatches();
            this.updateSeasonStats();
            this.updateMatchesList();
        }
    }

    deleteSavedPlayer(playerId) {
        if (confirm('Weet je zeker dat je deze speler wilt verwijderen?')) {
            this.savedPlayers = this.savedPlayers.filter(p => p.id !== playerId);
            this.saveSavedPlayers();
            this.updatePlayerSelect();
            this.updateSavedPlayersList();
        }
    }
}

// Initialize the app
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new MatchTracker();
});