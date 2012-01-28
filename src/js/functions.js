
// Client state
var participantRole = "";
var timeOfDay = "";
var timeout = null;
var isDead = false;
var liveMafia = 0;

// global variable keys
var globalURL = "http://ec2-174-129-51-197.compute-1.amazonaws.com/";
var deadListKey = "deadList";
var dayVoteNumberKey = "dayVoteNumber";
var nightVoteNumberKey = "nightVoteNumber";
var numberMafiaKey = "numMafia";
var gameIDKey = "gameID";
var votingListKey = "votingList";

/** 
 Small wrapper function to get the number of mafia in the game, based on the algorithm for how many mafia should be spawned
 @return Returns the number of mafia members in this game.
*/
function getNumberOfMafia() {
    var numParticipants = gapi.hangout.getEnabledParticipants().length;
    var numMafia = Math.floor(numParticipants / 3);
    return numMafia;
}

/**
 Performs an AJAX request to get the number of live mafia from the server.
*/
function getNumberOfLifeMafia() {
    var gameID = gapi.hangout.data.getState()[gameIDKey];
    var getURL = globalURL + "/" + gameID + "/numMafia";
    $.post(getURL,
	   function(data) {
	       console.log("Received number of live mafia:", data);
	       liveMafia = data;
	   });
}

/**
 Given a voting list, figures out the participant with the maximum number of votes in order to determine who the next person to die should be
 @param dict The dictionary to iterate through
 @return Returns the participant ID with the highest number of votes
*/
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


////////////////////////////////
// PRE-ROUND STATE CLEANUP
////////////////////////////////


/**
 Changes the time.
 @param newTime a string containing the new time, either "Day" or "Night"
*/
function changeTime(newTime) {
    if (participantRole == "Villager") {
	changeAVStatusForNewTime(newTime);
	if (newTime == "Day")
	    timeout = setTimeout("voteForSelfToDie()", 60000);
    }
}

/**
 Timeout function. The user votes to kill themselves.
*/
function voteForSelfToDie() {
    voteForUser(gapi.hangout.getParticipantId());
    stopTimer();
}

/** 
 Stops the timeout function.
*/
function stopTimer() {
    clearTimeout(timeout);
}


function die() {
    isDead = true;
    if (participantRole == "Mafia") {
	// TODO: Tell the server we're dead
    }
}

/**
  Changes the AV status for the new time.
  @param newTime A string containing the new time, either "Day" or "Night"
*/
function changeAVStatusForNewTime(newTime) {
    console.log("Changing status for participant: ", gapi.hangout.getParticipantId(), "with new time: ", newTime);
    var villagerEnable;
    if (newTime == "Day")
	villagerEnable = true;
    else
	villagerEnable = false;

    gapi.hangout.av.setMicrophoneMute(!villagerEnable);
    gapi.hangout.av.setCameraMute(!villagerEnable);
    for (participantID in gapi.hangout.getEnabledParticipants()) {
	gapi.hangout.av.setParticipantAudioLevel(participantID, !villagerEnable);
	gapi.hangout.av.setParticipantVisible(participantID, !villagerEnable);
    }
        
}

/**
 Client-side function that votes for a participant to be killed. Meant for both mafia and villagers.
 @param participantID the participant ID to vote for.
*/
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
    if (participantID in votingList) { 
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
	console.log("Number of votes needed to kill reached by participant: ", gapi.hangout.getParticipantId(), " with vote number: ", newVoteCount);
	var deadParticipant = findDeadPerson(votingList);
	deadList.push(deadParticipant);
	console.log("New dead list: ", deadList);
	newVoteCount = 0;
	deadListStringified = JSON.stringify(deadList);
	gapi.hangout.data.submitDelta( { "deadList": deadListStringified
				       });
    }

    ///////////////////////////////////////
    /// Always update the new vote count 
    ///////////////////////////////////////
    console.log("Participant: ", gapi.hangout.getParticipantId(), " pushing new vote count: ", newVoteVount);
    gapi.hangout.data.submitDelta( { "voteCount" : newVoteCount,
					   });				     
	   
}
