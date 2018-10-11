function getContextualAddOn(event) {
  // This gets the details of the current message
  var message = getCurrentMessage(event);
  // This is to fetch the email addresses from the message
  var emails = getEmails(message);
  // POST API to get a list of users who are present in the mail
  var jeevesUrl = 'https://domain.com/api/users/gmail_lookup.json?user_email=' + Session.getEffectiveUser().getEmail();
  var jeevesResponse = UrlFetchApp.fetch(jeevesUrl, { muteHttpExceptions: true, method: 'post', payload: { emails: emails.join(','), token: 'secure_token' } });
  var jeevesResponseData = JSON.parse(jeevesResponse.getContentText());
  // Array to hold all the cards that needs to be displayed in the add on
  var cards = [];
  // Checks if the API call was successful or not
  if(parseInt(jeevesResponse.getResponseCode()) !== 200) {
    // Renders a default error card when there is an issue with the script
    return renderErrorCard({ code: jeevesResponse.getResponseCode(), errors: jeevesResponseData.errors });
  }
  if(jeevesResponseData.data.users.length === 0) {
    // Renders a default error card when there is an issue with the script
    return renderErrorCard();
  }
  // Loop through the list of users and build their respective cards
  jeevesResponseData.data.users.forEach(function(user) {
    var card = CardService.newCardBuilder();
    card = constructBasicProfile(card, user);
    card = addAboutMeToCard(card, user);
    card = addCardActionsToCard(card, user);
    cards.push(card.build());
  });
  return cards;
}

function getCurrentMessage(event) {
  var accessToken = event.messageMetadata.accessToken;
  var messageId = event.messageMetadata.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  return GmailApp.getMessageById(messageId);
}

function getEmails(message) {
  var emailContent = message.getBody() + " " + message.getTo() + " " + message.getFrom() + " " + message.getCc() + " " + message.getBcc();
  var emailList = emailContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
  return emailList;
}

function constructBasicProfile(card, user) {
  var cardHeader = CardService.newCardHeader()
    .setTitle(user.full_name)
    .setImageStyle(CardService.ImageStyle.CIRCLE)
    .setImageUrl(user.profile_image);
  card.setHeader(cardHeader);
  return card;
}

function addAboutMeToCard(card, user) {
  if(user.about_me !== "") {
    var widget = CardService.newTextParagraph().setText(user.about_me)
    var section = CardService.newCardSection().setHeader("About Me").addWidget(widget);
    card.addSection(section);
  }
  return card;
}

function renderErrorCard(log) {
  var card = CardService.newCardBuilder();
  var textParagraph = CardService.newTextParagraph()
    .setText("There are no users found in the directory, or there is some issue fetching the users");
  if(log !== null && log !== undefined) {
    console.error(log);
  }
  var cardHeader = CardService.newCardHeader().setTitle("No Users Here!");
  var cardSection = CardService.newCardSection().addWidget(textParagraph);
  card.setHeader(cardHeader);
  card.addSection(cardSection);
  return [card.build()];
}
