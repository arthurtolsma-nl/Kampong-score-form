import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
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

export const MatchEntry = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState({
    opponent: '',
    date: '',
    homeAway: 'thuis' as 'thuis' | 'uit'
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const { toast } = useToast();

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, {
        name: newPlayerName.trim(),
        goals: 0,
        assists: 0,
        isMotm: false
      }]);
      setNewPlayerName('');
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

    const newMatch: Match = {
      id: Date.now().toString(),
      ...currentMatch,
      players: [...players]
    };

    setMatches([newMatch, ...matches]);
    setCurrentMatch({ opponent: '', date: '', homeAway: 'thuis' });
    setPlayers([]);
    
    toast({
      title: "Wedstrijd opgeslagen!",
      description: `${currentMatch.homeAway === 'thuis' ? 'Thuis' : 'Uit'} tegen ${currentMatch.opponent}`
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Kampong Statistieken</h1>
        <p className="text-muted-foreground">Voer wedstrijdgegevens in</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nieuwe wedstrijd</CardTitle>
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
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Spelers toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Naam speler"
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            />
            <Button onClick={addPlayer} size="icon">
              <Plus className="h-4 w-4" />
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
        Wedstrijd opslaan
      </Button>

      {matches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recente wedstrijden</h2>
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {match.homeAway === 'thuis' ? 'Thuis' : 'Uit'} vs {match.opponent}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(match.date).toLocaleDateString('nl-NL')}
                  </p>
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