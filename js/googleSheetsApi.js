if(typeof GoogleSheets == 'undefined') {
	GoogleSheets = {};
}

// Client ID and API key from the Developer Console
GoogleSheets.CLIENT_ID = '342063847321-mvo72qk956eveh9gn0cv2sg92nk1nd6l.apps.googleusercontent.com';
GoogleSheets.API_KEY = 'AIzaSyCfnoQUxENY8J5rQJ7Jq0_h9WHJ31mc8Oc';

// Array of API discovery doc URLs for APIs used by the quickstart
GoogleSheets.DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
GoogleSheets.SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

/**
*  On load, called to load the auth2 library and API client library.
*/
GoogleSheets.handleClientLoad = function() {
	gapi.load('client:auth2', GoogleSheets.initClient);
}

var handleClientLoad = GoogleSheets.handleClientLoad;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
GoogleSheets.initClient = function() {
	gapi.client.init({
		apiKey: GoogleSheets.API_KEY,
		clientId: GoogleSheets.CLIENT_ID,
		discoveryDocs: GoogleSheets.DISCOVERY_DOCS,
		scope: GoogleSheets.SCOPES
	}).then(function () {
		// Listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(GoogleSheets.updateSigninStatus);
		
		// Handle the initial sign-in state.
		GoogleSheets.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
	});
}
var initClient = GoogleSheets.initClient;

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
GoogleSheets.updateSigninStatus = function(isSignedIn) {
}

var updateSigninStatus = GoogleSheets.updateSigninStatus;

/**
*  Sign in the user upon button click.
*/
GoogleSheets.handleAuthClick = function(event) {
	gapi.auth2.getAuthInstance().signIn();
}

var handleAuthClick = GoogleSheets.handleAuthClick;

/**
*  Sign out the user upon button click.
*/
GoogleSheets.handleSignoutClick = function(event) {
	gapi.auth2.getAuthInstance().signOut();
}

var handleSignoutClick = GoogleSheets.handleSignoutClick;