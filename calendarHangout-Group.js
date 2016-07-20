function moveHangoutLinks() {
  var members = AdminDirectory.Members.list('groupname@domain.com'); //Pulls the membership for the calendar Group that needs to be updated
  var memberEmails = [];
  for (var x = 0; x < members.members.length; x++ ){ //Gets the emails for members of the group
    mem = members.members[x];
    memberEmails.push(mem.email);
  }
  var done = []
  var total = 0;
  var num = 0; //Counter for APi time limit
  var tStart = new Date();
  for ( var j = 0; j < memberEmails.length; j++){
    if (num < 20){ //Gurantees I will be under 500 API calls in 100 seconds. (Time limit for project)
      var calendarId = memberEmails[j];
      Logger.log(calendarId);
      var now = new Date();
      var events = Calendar.Events.list(calendarId, {
          timeMin: now.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50
      });
      if (events.items && events.items.length > 0) {
          var numDone = 0;
          for (var i = 0; i < events.items.length; i++) {
              var event = events.items[i];
              var d = event.description;
              if (!d)
                  d = '';
              if (event.hangoutLink && (d.indexOf('Hangout: ')== -1)){
                  Logger.log (event.summary + ' - ' + event.hangoutLink + ' - ' + event.description);
                  event.description = 'Hangout: ' + event.hangoutLink + '\n\n' + d;
                  Calendar.Events.update(event, calendarId, event.id);
                total ++;
                numDone ++;
              }
  
          }
          done.push(numDone);
      } else {
          Logger.log('No events found.');
      }
      num ++;
    } else { //Once I hit a max of 500 API calls, if 100 seconds has not elapsed. The function sleeps the remaining time
      num = 0;
      var tEnd = new Date();
      var tElapsed = tEnd - tStart;
      var tRemain = 1000000 - tElapsed;
      if( tRemain > 0){
        sleep(tRemain);
      }
      tStart = new Date(); //Reset time counter
    }
  }
  var bar = new Date();
  var string = "";
  for ( var j = 0; j < memberEmails.length; j++){
    string = string + memberEmails[j] + ": " + done[j] + "\n";
  }
  GmailApp.sendEmail('user@domain.com', 'HangoutsCalendar script run for' + bar, "Run at time:" + bar + "\nTotal number of events fixed: "+total + "\n" + string);  
  return memberEmails;
}

function doGet() {
  email = moveHangoutLinks();
  return HtmlService.createHtmlOutput('<b>' + email + '</b>');
}
