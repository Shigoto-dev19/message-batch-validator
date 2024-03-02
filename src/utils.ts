import { Field, Proof } from 'o1js';
import { BatchValidator, MessageDetails } from './zkProgram.js';

export {
  generateRandomValidMessageDetails,
  generateRandomMessage,
  generateMessageBatchProof,
  updateMessageNumber,
};

interface MockMessageDetails {
  agentId: Field;
  agentXLocation: Field;
  agentYLocation: Field;
  checkSum: Field;
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomMessageNumber(max = 10000): Field {
  return Field(generateRandomNumber(1, max));
}

function generateRandomValidMessageDetails(): MockMessageDetails {
  const randomAgentId = generateRandomNumber(0, 3000);
  const randomAgentXLocation = generateRandomNumber(0, 15000);
  const randomAgentYLocation = generateRandomNumber(
    randomAgentXLocation > 5000 ? randomAgentXLocation + 1 : 5000,
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

function generateRandomMessage(messageNumber: Field, fromAdmin = false) {
  return {
    messageNumber: fromAdmin ? Field(0) : messageNumber,
    messageDetails: new MessageDetails(generateRandomValidMessageDetails()),
  };
}

async function generateRandomValidMessageProof(maxMessageNumber?: number) {
  const messageNumber = generateRandomMessageNumber(maxMessageNumber);
  const message = generateRandomMessage(messageNumber);
  const messageProof = await BatchValidator.validateOneMessage(
    message.messageNumber,
    message.messageDetails
  );

  return messageProof;
}

async function generateMessageBatchProof(
  batchSize: number,
  maxMessageNumber?: number
) {
  let batchProof: Proof<Field, void> = await generateRandomValidMessageProof(
    maxMessageNumber
  );
  for (let i = 1; i < batchSize; i++) {
    let messageProof = await generateRandomValidMessageProof(maxMessageNumber);
    let updatedMessageNumber = updateMessageNumber(
      batchProof.publicInput,
      messageProof.publicInput
    );

    let mergedProof = await BatchValidator.mergeMessage(
      updatedMessageNumber,
      batchProof,
      messageProof
    );
    batchProof = mergedProof;
  }

  return batchProof;
}

function updateMessageNumber(message1Number: Field, message2Number: Field) {
  return message1Number.toBigInt() > message2Number.toBigInt()
    ? message1Number
    : message2Number;
}
