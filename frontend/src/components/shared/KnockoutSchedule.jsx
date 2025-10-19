// frontend/src/components/shared/KnockoutSchedule.jsx - Simplified Column View with Advancement Logic

import React, { useState, useEffect, useCallback } from 'react';
import MatchCard from './MatchCard';
import axios from 'axios'; 
import { titleStyles, rrMatchCardStyles } from './TournamentStyles'; 


// --- STYLES (Reverted to simple column rendering styles) ---
const bracketContainerStyles = {
    display: 'flex',
    justifyContent: 'flex-start', 
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
    flexShrink: 0, // Prevents columns from squishing on horizontal scroll
};


// --- HELPER FUNCTIONS (Simplified and Re-Included for Readability) ---

// This helper is for local data processing/display logic
const checkIfRoundIsCompleted = (matches) => {
    return matches.every(match => match.status === 'completed');
};

// Defines the order of knockout rounds
const getNextRoundName = (currentRoundName) => {
    const order = ['Round 1', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
    const currentIndex = order.indexOf(currentRoundName);
    return order[currentIndex + 1]; 
};

// Groups matches by round (Assuming this helper exists in your project or is implemented locally)
const groupMatchesByRound = (matches) => {
    if (!matches) return [];

    const groups = matches.reduce((acc, match) => {
        const roundName = match.round || 'Round 1'; 
        if (!acc[roundName]) { acc[roundName] = []; }
        acc[roundName].push(match);
        return acc;
    }, {});
    
    // Sort rounds based on the predefined order
    const order = ['Round 1', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
    
    return order.map(name => ({ 
        name, 
        matches: groups[name] || [] 
    })).filter(round => round.matches.length > 0)
       .map(round => ({ 
           ...round, 
           // Sort matches within each round (important for correct pairing in next round!)
           matches: round.matches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
       }));
};


// --- MAIN KNOCKOUT COMPONENT ---

const KnockoutSchedule = ({ tournamentData, matches, onScoreUpdate, isTournamentCompleted, maxParticipants, onUpdate }) => {
    
    const roundStructure = groupMatchesByRound(matches);
    
    // Identify the LAST round *with matches* that is not the final
    const currentRound = roundStructure.slice(0, -1).findLast(round => round.matches.length > 0) || roundStructure.findLast(round => round.matches.length > 0);
    
    const isCurrentRoundCompleted = currentRound ? checkIfRoundIsCompleted(currentRound.matches) : false;
    const canProceed = isCurrentRoundCompleted && currentRound && getNextRoundName(currentRound.name);

    // --- API Handler to Proceed to Next Round ---
    const handleProceedToNextRound = useCallback(async () => {
        if (!canProceed || isTournamentCompleted) return;
        
        const currentRoundName = currentRound.name;
        const nextRoundName = getNextRoundName(currentRoundName);
        
        if (!nextRoundName || nextRoundName === currentRoundName) {
            return alert("Cannot proceed: No subsequent round defined or this is the final round.");
        }
        
        try {
            // Note: This relies on the backend route implementation from the previous step.
            await axios.post(`/api/matches/${tournamentData._id}/next-round`, {
                currentRoundName,
                nextRoundName,
                expectedMatchCount: currentRound.matches.length
            });

            alert(`Successfully created matches for ${nextRoundName}!`);
            // Trigger a data refresh in the parent component
            if (onUpdate) onUpdate(); 

        } catch (error) {
            console.error('Failed to generate next round:', error);
            const errorMessage = error.response?.data?.message || 'Failed to communicate with server.';
            alert(`Error processing next round: ${errorMessage}`);
        }
    }, [canProceed, currentRound, tournamentData._id, isTournamentCompleted, onUpdate]);


    return (
        <div style={bracketContainerStyles}>
            
            {/* Display matches column by column */}
            {roundStructure.map((round, roundIndex) => (
                <div key={round.name} style={roundColumnStyles}>
                    <h3 style={{...titleStyles, paddingBottom: '0', marginBottom: '10px'}}>{round.name}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                         {round.matches.map((match) => (
                             <div key={match._id} style={{ padding: 0 }}>
                                <MatchCard 
                                    match={match} 
                                    onScoreUpdate={onScoreUpdate} 
                                    isTournamentCompleted={isTournamentCompleted} 
                                    isSingleElimination={true} 
                                    hasAdminRights={false} // FORCES READ-ONLY MODE
                                    // Removed dynamic styling logic
                                />
                            </div>
                        ))}
                         
                         {/* Button to Proceed to Next Round */}
                         {(currentRound && round.name === currentRound.name && canProceed && !isFinalRound) && (
                            <div style={{ paddingTop: '20px', width: '100%', textAlign: 'center' }}>
                                <button 
                                    onClick={handleProceedToNextRound}
                                    style={{
                                        padding: '8px 15px',
                                        backgroundColor: '#39ff14', 
                                        color: '#1a1a1a',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏆 Proceed to {getNextRoundName(currentRound.name)}
                                </button>
                            </div>
                         )}
                    </div>
                </div>
            ))}

        </div>
    );
};

export default KnockoutSchedule;