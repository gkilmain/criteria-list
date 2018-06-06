/* eslint-disable  func-names */
/* eslint-disable  no-console */
const json = require('./people.json');
const Alexa = require('ask-sdk-core');

const InProgressQueryIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log('This called: ', this)
    return request.type === 'IntentRequest' &&
      request.intent.name === 'StartQuery' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const CompletedQueryIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'StartQuery';
  },
  handle(handlerInput){
    const responseBuilder = handlerInput.responseBuilder;
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = getSlotValues(filledSlots);
    const data = json.people.filter((person) => (person.company.toLowerCase() === slotValues.COMPANY_NAME.resolved.toLowerCase() && person.address.city.toLowerCase() === 'Boston'.toLocaleLowerCase()))
    
    return handlerInput.responseBuilder
    .speak(`I found ${data.length} people that match your criteria. I've sent the data as a skill card for you to see on your Alexa app.`)
    .withSimpleCard('Your Criteria List', JSON.stringify(data))
    .getResponse()
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    InProgressQueryIntentHandler,    
    CompletedQueryIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

  function getSlotValues(filledSlots) {
    const slotValues = {};
  
    console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
      const name = filledSlots[item].name;
  
      if (filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
          case 'ER_SUCCESS_MATCH':
            slotValues[name] = {
              synonym: filledSlots[item].value,
              resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
              isValidated: true,
            };
            break;
          case 'ER_SUCCESS_NO_MATCH':
            slotValues[name] = {
              synonym: filledSlots[item].value,
              resolved: filledSlots[item].value,
              isValidated: false,
            };
            break;
          default:
            break;
        }
      } else {
        slotValues[name] = {
          synonym: filledSlots[item].value,
          resolved: filledSlots[item].value,
          isValidated: false,
        };
      }
    }, this);
  
    return slotValues;
  }
