// frontend/src/components/shared/KnockoutSchedule.jsx - FINAL CODE (Clean Column View)

import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard';
// Import necessary styles from the dedicated style file
import { titleStyles, rrMatchCardStyles } from './TournamentStyles'; 


// --- STYLES (Adjusted for stable column rendering) ---
const bracketContainerStyles = {
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'flex-start',    
    padding: '20px',
    backgroundColor: '#1a1a1a', 
    borderRadius: '10px',
    minHeight: '300px', 
    width: '100%',
    overflowX: 'auto',
    position: 'relative', 
};

const roundColumnStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start', 
    gap: '20px', 
    alignItems: 'center',
    padding: '0 40px 0 20px', 
    position: 'relative', 
    minWidth: '250px',
};

// --- HELPER LOGIC ---

const getWinnerInfo = (match) => {
    if (!match || match.status !== 'completed' || !match.scores) return { name: 'TBD', teamId: null }; 
    
    const scoreA = match.scores.teamA || 0;
    const scoreB = match.scores.teamB || 0;
    
    if (scoreA > scoreB) return { name: match.teams[0]?.name || 'TBD', teamId: match.teams[0]?._id };
    if (scoreB > scoreA) return { name: match.teams[1]?.name || 'TBD', teamId: match.teams[1]?._id };
    return { name: 'TBD (Tie)', teamId: null }; 
};


// --- MAIN KNOCKOUT COMPONENT (READ-ONLY VISUALIZATION) ---

const KnockoutSchedule = ({ tournamentData, matches, onScoreUpdate, isTournamentCompleted, maxParticipants }) => {

    // Initialized as an Array
    const [roundStructure, setRoundStructure] = useState([]); 

    // Process matches into rounds for visual structure
    useEffect(() => {
        if (!matches || matches.length === 0) {
            setRoundStructure([]);
            return;
        }

        const groups = matches.reduce((acc, match) => {
            const roundName = match.round || 'Round 1'; 
            if (!acc[roundName]) { acc[roundName] = []; }
            acc[roundName].push(match);
            return acc;
        }, {});
        
        // Define order for display
        const order = ['Round 1', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
        
        const sortedRounds = order.map(name => ({ name, matches: groups[name] || [] }))
                                 .filter(round => round.matches.length > 0);
        
        setRoundStructure(sortedRounds);

    }, [matches]);
    
    
    const renderMatchesInRound = (roundMatches, isNextRound) => {
        return roundMatches.map((match, index) => (
             <div key={match._id} style={{ marginBottom: isNextRound ? '50px' : '10px' }}>
                <MatchCard 
                    match={match} 
                    onScoreUpdate={() => alert("Please use the 'Fixtures (Score Entry)' tab to modify scores.")} 
                    isTournamentCompleted={isTournamentCompleted} 
                    isSingleElimination={true} 
                    hasAdminRights={false} // FORCES READ-ONLY MODE
                />
            </div>
        ));
    };


    return (
        <div style={bracketContainerStyles}>
            
            {/* Display matches column by column */}
            {roundStructure.map((round, roundIndex) => (
                <div key={round.name} style={roundColumnStyles}>
                    <h3 style={{...titleStyles, paddingBottom: '0', marginBottom: '10px'}}>{round.name}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                         {renderMatchesInRound(round.matches, roundIndex > 0)}
                         
                         {/* Placeholder for the visual feeder into the next round */}
                         {(roundIndex < roundStructure.length - 1) && (
                            <div style={{ paddingBottom: '40px' }}>
                                <p style={{ margin: 0, fontSize: '0.8em', color: '#39ff14' }}>— ADVANCES —</p>
                            </div>
                         )}
                    </div>
                </div>
            ))}

        </div>
    );
};

export default KnockoutSchedule;