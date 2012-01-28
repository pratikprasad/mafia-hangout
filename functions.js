
// Client variables
var participantRole = "";
var timeOfDay = "";

// global variable keys
var deadListKey = "deadList";
var dayVoteNumberKey = "dayVoteNumber";
var nightVoteNumberKey = "nightVoteNumber";
var numberMafiaKey = "numMafia";
var gameIDKey = "gameID";
var votingListKey = "votingList";

//deadList = gapi.hangout.data.getState('deadList');

function getNumberOfMafia() {
    var numParticipants = gapi.hangout.getEnabledParticipants().length;
    var numMafia = Math.floor(numParticipants / 3);
    return numMafia;
}

function findDeadPerson(dict) {
    var maxID = "";
    var maxCount = 0;

    for (key in dict) { // TODO: Does this work?
	if (dict[key] > maxCount) {
	    maxID = key;
	    maxCount = dict[key];
	}
    }

    return maxID;
}

function voteForUser(participantID) {

    // Locals
    var voteCountKey;
    var votesNeeded;
    var deadList = gapi.hangout.data.getState()[deadListKey];
    var newVoteCount;
    var deadListStringified;

    //////////////////////////////////////////////////
    /// Update the voting list 
    /////////////////////////////////////////////////
    var votingList = JSON.Parse(gapi.hangout.data.getState()[votingListKey]);
    if (participantID in votingList) { // TODO: Does this work?
	count = votingList[key];
	votingList[key] = count + 1;
    } else {
	votingList[participantID] = 0;
    }
    

    ///////////////////////////////////////////////////
    /// Check number of votes
    //////////////////////////////////////////////////
    if (timeOfDay == "Night") { 
	if (participantRole != "Mafia") {
	    // TODO: Throw an error of some kind
	    return;
	} 
	voteCountKey = nightVoteNumberKey;
	votesNeeded = gapi.hangout.data.getState()[numberMafiaKey];	
    } else { // Daytime
	voteCountKey = dayVoteNumberKey;
	votesNeeded = gapi.hangout.getEnabledParticipants().length;
    }
    newVoteCount = gapi.hangout.data.getState()[voteCountKey] + 1;

    /////////////////////////////////////////////////
    // Push the dead list if necessary
    /////////////////////////////////////////////////
    if (newVoteCount == votesNeeded) {
	var deadParticipant = findDeadPerson(votingList);
	deadList.push(deadParticipant);
	newVoteCount = 0;
	deadListStringified = JSON.stringify(deadList);
	gapi.hangout.data.submitDelta( { "deadList": deadListStringified
				       });
    }

    ///////////////////////////////////////
    /// Always update the new vote count 
    ///////////////////////////////////////
    gapi.hangout.data.submitDelta( { "voteCount" : newVoteCount,
					   });				     
	   
}
