import { Field } from 'o1js';
import { MessageDetails } from './batch.js';

export { generateRandomMessage };

interface MockMessageDetails {
  agentId: Field;
  agentXLocation: Field;
  agentYLocation: Field;
  checkSum: Field;
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomValidMessageDetails(): MockMessageDetails {
  const randomAgentId = generateRandomNumber(0, 3000);
  const randomAgentXLocation = generateRandomNumber(0, 15000);
  const randomAgentYLocation = generateRandomNumber(
    randomAgentXLocation + 1,
    20000
  );
  const checkSum = randomAgentId + randomAgentXLocation + randomAgentYLocation;

  return {
    agentId: Field(randomAgentId),
    agentXLocation: Field(randomAgentXLocation),
    agentYLocation: Field(randomAgentYLocation),
    checkSum: Field(checkSum),
  };
}

function generateRandomMessage(messageNumber: Field, fromAdmin=false) {
  return {
    messageNumber: fromAdmin ? Field(0) : messageNumber,
    messageDetails: new MessageDetails(generateRandomValidMessageDetails()),
  };
}
