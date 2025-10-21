
import React, { useState } from 'react';
import { updateButtonStyles, scoreFieldStyles, rrScoreInputStyles } from './TournamentStyles';

const MAX_SETS = 3;

const BadmintonScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  // Initialize local state for sets
  const initialSets = match.sets && match.sets.length > 0
    ? match.sets
    : [{ setNumber: 1, teamAScore: 0, teamBScore: 0 }];
  const [sets, setSets] = useState(initialSets);

  // Add a new set (admin only, up to 3)
  const handleAddSet = () => {
    if (sets.length < MAX_SETS) {
      setSets([...sets, { setNumber: sets.length + 1, teamAScore: 0, teamBScore: 0 }]);
    }
  };

  // Handle score change for a set
  const handleScoreChange = (setIdx, team, value) => {
    const newSets = sets.map((s, idx) =>
      idx === setIdx ? { ...s, [team]: Number(value) } : s
    );
    setSets(newSets);
  };


  // Calculate sets won for each team
  const getSetsWon = () => {
    let teamAWins = 0, teamBWins = 0;
    sets.forEach(set => {
      if (set.teamAScore > set.teamBScore) teamAWins++;
      else if (set.teamBScore > set.teamAScore) teamBWins++;
    });
    return [teamAWins, teamBWins];
  };

  // Save all sets when all are locked
  const handleSaveAll = () => {
    if (onScoreUpdate) {
      const [teamAWins, teamBWins] = getSetsWon();
      const scores = [
        { teamId: match.teams[0]?._id || match.teams[0], score: teamAWins },
        { teamId: match.teams[1]?._id || match.teams[1], score: teamBWins }
      ];
      onScoreUpdate(match._id, { sets, scores });
    }
  };

  return (
    <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 16, background: '#222' }}>
      <h3 style={{ color: '#e0e0e0', marginBottom: 10 }}>Badminton Match</h3>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 15 }}>
        <h4 style={{ color: '#00ffaa' }}>{match.teams[0]?.name || 'Player 1'}</h4>
        <span style={{ color: '#e0e0e0', fontWeight: 'bold' }}>VS</span>
        <h4 style={{ color: '#00ffaa' }}>{match.teams[1]?.name || 'Player 2'}</h4>
      </div>
      {sets.map((set, idx) => (
        <div key={idx} style={{ marginBottom: 12, padding: 8, background: '#292929', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <span style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Set {set.setNumber}</span>
            {/* Team A score with up/down */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => handleScoreChange(idx, 'teamAScore', Math.max(0, set.teamAScore - 1))}
                disabled={isTournamentCompleted}
                style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginRight: 2 }}
              >-</button>
              <input
                type="number"
                min={0}
                value={set.teamAScore}
                disabled={isTournamentCompleted}
                onChange={e => handleScoreChange(idx, 'teamAScore', e.target.value)}
                style={rrScoreInputStyles}
              />
              <button
                type="button"
                onClick={() => handleScoreChange(idx, 'teamAScore', Number(set.teamAScore) + 1)}
                disabled={isTournamentCompleted}
                style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginLeft: 2 }}
              >+</button>
            </div>
            <span style={{ color: '#a0a0a0', fontWeight: 'bold' }}>-</span>
            {/* Team B score with up/down */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => handleScoreChange(idx, 'teamBScore', Math.max(0, set.teamBScore - 1))}
                disabled={isTournamentCompleted}
                style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginRight: 2 }}
              >-</button>
              <input
                type="number"
                min={0}
                value={set.teamBScore}
                disabled={isTournamentCompleted}
                onChange={e => handleScoreChange(idx, 'teamBScore', e.target.value)}
                style={rrScoreInputStyles}
              />
              <button
                type="button"
                onClick={() => handleScoreChange(idx, 'teamBScore', Number(set.teamBScore) + 1)}
                disabled={isTournamentCompleted}
                style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginLeft: 2 }}
              >+</button>
            </div>
            {hasAdminRights && !isTournamentCompleted && sets.length < MAX_SETS && idx === sets.length - 1 && (
              <button onClick={handleAddSet} style={{ marginLeft: 16, background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer' }}>Add Set</button>
            )}
          </div>
        </div>
      ))}
      {hasAdminRights && !isTournamentCompleted && sets.length === MAX_SETS && (
        <button onClick={handleSaveAll} style={updateButtonStyles}>Save All Sets</button>
      )}
      {isTournamentCompleted && <p style={{ color: '#ff6b6b', marginTop: 10 }}>Tournament Completed - Scoring Disabled</p>}
    </div>
  );
};

export default BadmintonScorecard;
