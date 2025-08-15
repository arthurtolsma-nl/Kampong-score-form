import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, X, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Player {
  name: string;
  goals: number;
  assists: number;
  isMotm: boolean;
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  homeAway: 'thuis' | 'uit';
  players: Player[];
}

interface SavedPlayer {
  id: string;
  name: string;
}

export const MatchEntry = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);
  const [currentMatch, setCurrentMatch] = useState({
    opponent: '',
    date: '',
    homeAway: 'thuis' as 'thuis' | 'uit'
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState('');
  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMatches = localStorage.getItem('kampong-matches');
    const savedPlayersList = localStorage.getItem('kampong-players');
    
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
    if (savedPlayersList) {
      setSavedPlayers(JSON.parse(savedPlayersList));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('kampong-matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('kampong-players', JSON.stringify(savedPlayers));
  }, [savedPlayers]);

  const addPlayerFromSelect = () => {
    if (selectedPlayer) {
      const playerName = selectedPlayer === 'new' ? newPlayerName.trim() : selectedPlayer;
      if (playerName && !players.find(p => p.name === playerName)) {
        const newPlayer = {
          name: playerName,
          goals: 0,
          assists: 0,
          isMotm: false
        };
        setPlayers([...players, newPlayer]);
        
        // Add to saved players if new
        if (selectedPlayer === 'new' && !savedPlayers.find(p => p.name === playerName)) {
          const newSavedPlayer = {
            id: Date.now().toString(),
            name: playerName
          };
          setSavedPlayers([...savedPlayers, newSavedPlayer]);
        }
        
        setSelectedPlayer('');
        setNewPlayerName('');
      }
    }
  };

  const updatePlayerGoals = (index: number, goals: number) => {
    const updated = [...players];
    updated[index].goals = Math.max(0, goals);
    setPlayers(updated);
  };

  const updatePlayerAssists = (index: number, assists: number) => {
    const updated = [...players];
    updated[index].assists = Math.max(0, assists);
    setPlayers(updated);
  };

  const toggleMotm = (index: number) => {
    const updated = players.map((player, i) => ({
      ...player,
      isMotm: i === index ? !player.isMotm : false
    }));
    setPlayers(updated);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const saveMatch = () => {
    if (!currentMatch.opponent || !currentMatch.date) {
      toast({
        title: "Vul alle velden in",
        description: "Tegenstander en datum zijn verplicht",
        variant: "destructive"
      });
      return;
    }

    if (editingMatch) {
      // Update existing match
      const updatedMatches = matches.map(m => 
        m.id === editingMatch.id 
          ? { ...editingMatch, ...currentMatch, players: [...players] }
          : m
      );
      setMatches(updatedMatches);
      setEditingMatch(null);
      toast({
        title: "Wedstrijd bijgewerkt!",
        description: `${currentMatch.homeAway === 'thuis' ? 'Thuis' : 'Uit'} tegen ${currentMatch.opponent}`
      });
    } else {
      // Create new match
      const newMatch: Match = {
        id: Date.now().toString(),
        ...currentMatch,
        players: [...players]
      };
      setMatches([newMatch, ...matches]);
      toast({
        title: "Wedstrijd opgeslagen!",
        description: `${currentMatch.homeAway === 'thuis' ? 'Thuis' : 'Uit'} tegen ${currentMatch.opponent}`
      });
    }

    // Reset form
    setCurrentMatch({ opponent: '', date: '', homeAway: 'thuis' });
    setPlayers([]);
  };

  const editMatch = (match: Match) => {
    setEditingMatch(match);
    setCurrentMatch({
      opponent: match.opponent,
      date: match.date,
      homeAway: match.homeAway
    });
    setPlayers([...match.players]);
  };

  const deleteMatch = (matchId: string) => {
    setMatches(matches.filter(m => m.id !== matchId));
    toast({
      title: "Wedstrijd verwijderd",
      description: "De wedstrijd is succesvol verwijderd"
    });
  };

  const cancelEdit = () => {
    setEditingMatch(null);
    setCurrentMatch({ opponent: '', date: '', homeAway: 'thuis' });
    setPlayers([]);
  };

  const updatePlayerName = () => {
    if (editingPlayerName.trim() && editingPlayerId) {
      const updatedSavedPlayers = savedPlayers.map(p => 
        p.id === editingPlayerId 
          ? { ...p, name: editingPlayerName.trim() }
          : p
      );
      setSavedPlayers(updatedSavedPlayers);
      
      // Update matches with old player name
      const oldPlayerName = savedPlayers.find(p => p.id === editingPlayerId)?.name;
      if (oldPlayerName) {
        const updatedMatches = matches.map(match => ({
          ...match,
          players: match.players.map(player => 
            player.name === oldPlayerName 
              ? { ...player, name: editingPlayerName.trim() }
              : player
          )
        }));
        setMatches(updatedMatches);
      }
      
      setEditingPlayerName('');
      setEditingPlayerId('');
      toast({
        title: "Speler bijgewerkt",
        description: "De spelernaam is succesvol aangepast"
      });
    }
  };

  const deletePlayer = (playerId: string) => {
    setSavedPlayers(savedPlayers.filter(p => p.id !== playerId));
    toast({
      title: "Speler verwijderd",
      description: "De speler is verwijderd uit de lijst"
    });
  };

  // Calculate total stats
  const playerStats = savedPlayers.map(savedPlayer => {
    const totalGoals = matches.reduce((sum, match) => {
      const player = match.players.find(p => p.name === savedPlayer.name);
      return sum + (player?.goals || 0);
    }, 0);
    
    const totalAssists = matches.reduce((sum, match) => {
      const player = match.players.find(p => p.name === savedPlayer.name);
      return sum + (player?.assists || 0);
    }, 0);
    
    const motmCount = matches.reduce((sum, match) => {
      const player = match.players.find(p => p.name === savedPlayer.name);
      return sum + (player?.isMotm ? 1 : 0);
    }, 0);

    return {
      ...savedPlayer,
      totalGoals,
      totalAssists,
      motmCount
    };
  }).filter(player => player.totalGoals > 0 || player.totalAssists > 0 || player.motmCount > 0);

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Kampong Statistieken</h1>
        <p className="text-muted-foreground">
          {editingMatch ? 'Wedstrijd bewerken' : 'Voer wedstrijdgegevens in'}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingMatch ? 'Wedstrijd bewerken' : 'Nieuwe wedstrijd'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="opponent">Tegenstander</Label>
            <Input
              id="opponent"
              value={currentMatch.opponent}
              onChange={(e) => setCurrentMatch({ ...currentMatch, opponent: e.target.value })}
              placeholder="Naam tegenstander"
            />
          </div>
          
          <div>
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={currentMatch.date}
              onChange={(e) => setCurrentMatch({ ...currentMatch, date: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={currentMatch.homeAway === 'thuis' ? 'default' : 'outline'}
              onClick={() => setCurrentMatch({ ...currentMatch, homeAway: 'thuis' })}
              className="flex-1"
            >
              Thuis
            </Button>
            <Button
              variant={currentMatch.homeAway === 'uit' ? 'default' : 'outline'}
              onClick={() => setCurrentMatch({ ...currentMatch, homeAway: 'uit' })}
              className="flex-1"
            >
              Uit
            </Button>
          </div>

          {editingMatch && (
            <Button variant="outline" onClick={cancelEdit} className="w-full">
              Annuleren
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Spelers toevoegen</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Beheer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Spelers beheren</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {savedPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{player.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPlayerId(player.id);
                          setEditingPlayerName(player.name);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Speler verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je {player.name} wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePlayer(player.id)}>
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                
                {editingPlayerId && (
                  <div className="flex gap-2 p-2 bg-accent rounded">
                    <Input
                      value={editingPlayerName}
                      onChange={(e) => setEditingPlayerName(e.target.value)}
                      placeholder="Nieuwe naam"
                    />
                    <Button onClick={updatePlayerName} size="sm">
                      Opslaan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingPlayerId('');
                        setEditingPlayerName('');
                      }}
                      size="sm"
                    >
                      Annuleren
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een speler" />
              </SelectTrigger>
              <SelectContent>
                {savedPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.name}>
                    {player.name}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Nieuwe speler</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPlayer === 'new' && (
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Naam nieuwe speler"
                onKeyPress={(e) => e.key === 'Enter' && addPlayerFromSelect()}
              />
            )}
            
            <Button 
              onClick={addPlayerFromSelect} 
              className="w-full"
              disabled={!selectedPlayer || (selectedPlayer === 'new' && !newPlayerName.trim())}
            >
              <Plus className="h-4 w-4 mr-2" />
              Toevoegen
            </Button>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{player.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayer(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <Label className="text-xs">Goals</Label>
                    <Input
                      type="number"
                      min="0"
                      value={player.goals}
                      onChange={(e) => updatePlayerGoals(index, parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Assists</Label>
                    <Input
                      type="number"
                      min="0"
                      value={player.assists}
                      onChange={(e) => updatePlayerAssists(index, parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <Button
                  variant={player.isMotm ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMotm(index)}
                  className="w-full"
                >
                  {player.isMotm ? '⭐ Man of the Match' : 'Maak Man of the Match'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={saveMatch} 
        className="w-full mb-6"
        disabled={!currentMatch.opponent || !currentMatch.date}
      >
        {editingMatch ? 'Wijzigingen opslaan' : 'Wedstrijd opslaan'}
      </Button>

      {playerStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seizoen Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playerStats
                .sort((a, b) => (b.totalGoals + b.totalAssists) - (a.totalGoals + a.totalAssists))
                .map((player) => (
                <div key={player.id} className="flex justify-between items-center py-1">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex gap-2">
                    {player.totalGoals > 0 && (
                      <Badge variant="secondary">⚽ {player.totalGoals}</Badge>
                    )}
                    {player.totalAssists > 0 && (
                      <Badge variant="outline">🅰️ {player.totalAssists}</Badge>
                    )}
                    {player.motmCount > 0 && (
                      <Badge>⭐ {player.motmCount}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {matches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recente wedstrijden</h2>
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {match.homeAway === 'thuis' ? 'Thuis' : 'Uit'} vs {match.opponent}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editMatch(match)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Wedstrijd verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je deze wedstrijd tegen {match.opponent} wilt verwijderen?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMatch(match.id)}>
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {match.players.length > 0 ? (
                    <div className="space-y-2">
                      {match.players.map((player, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="font-medium">{player.name}</span>
                          <div className="flex gap-2">
                            {player.goals > 0 && (
                              <Badge variant="secondary">⚽ {player.goals}</Badge>
                            )}
                            {player.assists > 0 && (
                              <Badge variant="outline">🅰️ {player.assists}</Badge>
                            )}
                            {player.isMotm && (
                              <Badge>⭐ MOTM</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Geen spelergegevens</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};