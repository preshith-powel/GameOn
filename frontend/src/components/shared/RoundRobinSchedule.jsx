// frontend/src/components/shared/RoundRobinSchedule.jsx - FINAL CORRECTED CODE

import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard'; 
// *** FINAL FIX: Import styles from the dedicated TournamentStyles file ***
import { 
    roundTabStyles 
} from './TournamentStyles'; 


const RoundRobinSchedule = ({ matches, fetchMatches, token, isTournamentCompleted, onScoreUpdate, hasAdminRights }) => {
    const [matchesByRound, setMatchesByRound] = useState({});
    const [roundNames, setRoundNames] = useState([]);
    const [activeRound, setActiveRound] = useState(null);

    // CRITICAL: Logic to group matches into rounds based on the formula
    const groupMatchesByRound = (allMatches) => {
        if (allMatches.length === 0) return {};
        
        const rounds = {};
        
        // Group matches by their round field (for knockout tournaments)
        allMatches.forEach(match => {
            if (match.round) {
                if (!rounds[match.round]) {
                    rounds[match.round] = [];
                }
                rounds[match.round].push(match);
            } else {
                // Fallback for round robin tournaments without round field
                const totalMatches = allMatches.length;
                const N = Math.ceil((1 + Math.sqrt(1 + 8 * totalMatches)) / 2);
                const matchesPerRound = Math.ceil(N / 2);
                
                // Calculate which round this match belongs to
                const matchIndex = allMatches.indexOf(match);
                const roundNumber = Math.floor(matchIndex / matchesPerRound) + 1;
                const roundName = `Round ${roundNumber}`;
                
                if (!rounds[roundName]) {
                    rounds[roundName] = [];
                }
                rounds[roundName].push(match);
            }
        });
        
        return rounds;
    };


    useEffect(() => {
        const groups = groupMatchesByRound(matches);
        
        // Sort round names in tournament order (for knockout tournaments)
        const names = Object.keys(groups).sort((a, b) => {
            const roundOrder = {
                'Round of 64': 1,
                'Round of 32': 2,
                'Round of 16': 3,
                'Quarterfinal': 4,
                'Semifinal': 5,
                'Final': 6
            };
            
            const aOrder = roundOrder[a] || 999;
            const bOrder = roundOrder[b] || 999;
            
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            
            // For rounds with same order, sort alphabetically
            return a.localeCompare(b);
        });
        
        setMatchesByRound(groups);
        setRoundNames(names);
        
        // Set the active round to the first one if none is active
        if (!activeRound && names.length > 0) {
            setActiveRound(names[0]);
        }
    }, [matches]); // Re-run whenever the matches data updates


    const activeRoundMatches = activeRound ? matchesByRound[activeRound] || [] : [];
    
    // --- Handlers ---
    const handleRoundChange = (roundName) => {
        setActiveRound(roundName);
    };

    // This handler simply passes the update up to the parent TournamentViewPage
    // Pass through the scoreData object from MatchCard directly
    const handleScoreUpdate = (matchId, scoreData) => {
        onScoreUpdate(matchId, scoreData);
    };


    if (matches.length === 0) {
        return <p>No matches scheduled yet for this tournament.</p>;
    }
    
    return (
        <div style={{ padding: '0px' }}>
            
            {/* Round Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                {roundNames.map(roundName => (
                    <button 
                        key={roundName} 
                        style={roundTabStyles(activeRound === roundName)} // Uses the correctly imported style
                        onClick={() => handleRoundChange(roundName)}
                    >
                        {roundName}
                    </button>
                ))}
            </div>

            {/* Matches for Active Round - Vertical Stacking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', width: '100%' }}>
                {activeRoundMatches.map(match => (
                    <MatchCard 
                        key={match._id} 
                        match={match} 
                        onScoreUpdate={handleScoreUpdate} // Pass local handler down
                        isTournamentCompleted={isTournamentCompleted}
                        hasAdminRights={hasAdminRights} // Pass down scoring rights
                    />
                ))}
            </div>
        </div>
    );
};

export default RoundRobinSchedule;