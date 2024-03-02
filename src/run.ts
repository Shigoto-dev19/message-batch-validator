import { Field, Proof, verify } from 'o1js';
import { BatchValidator, MessageDetails } from './zkProgram.js';
import { generateRandomMessage, updateMessageNumber } from './utils.js';

async function main() {
  // Print batch ZkProgram summary
  console.log(
    'ZkProgram validateOneMessage summary:',
    BatchValidator.analyzeMethods().validateOneMessage.summary()
  );
  console.log(
    'ZkProgram mergeMessage summary:',
    BatchValidator.analyzeMethods().mergeMessage.summary()
  );

  console.log('\ncompiling...\n');
  const { verificationKey } = await BatchValidator.compile();

  console.log('generating message information\n');

  // The agent is Admin(agentId=0) and invalid Message details should pass
  const message1 = generateRandomMessage(Field(6), true);
  
  // Invalid message 
  const message2 = {
    messageNumber: Field(5),
    messageDetails: new MessageDetails({
      agentId: Field(800),
      agentXLocation: Field(1200),
      agentYLocation: Field(13000),
      checkSum: Field(17000),
    }),
  };

  // Invalid message 
  const message3 = {
    messageNumber: Field(7),
    messageDetails: new MessageDetails({
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(17000),
    }),
  };

  // Invalid message 
  const message4 = {
    messageNumber: Field(233),
    messageDetails: new MessageDetails({
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(17000),
    }),
  };

  const message5 = generateRandomMessage(Field(7));

  const message1Duplicate = generateRandomMessage(Field(3));

  const message6 = generateRandomMessage(Field(19));

  const messages = [
    message1,
    message2,
    message3,
    message4,
    message5,
    message1Duplicate,
    message6,
  ];

  console.log('making first set of proofs\n');

  const messageProofs: Proof<Field, void>[] = [];
  for (let message of messages) {
    try {
      const proof = await BatchValidator.validateOneMessage(
        message.messageNumber,
        message.messageDetails
      );
      messageProofs.push(proof);
    } catch (error) {
      console.log(
        `❌ Dropped invalid message \x1b[33mNumber=${message.messageNumber
          .toBigInt()
          .toString()}\x1b[0m`
      );
    }
  }

  console.log('\nmerging proofs...\n');

  let batchProof: Proof<Field, void> = messageProofs[0];
  for (let i = 1; i < messageProofs.length; i++) {
    const updatedMessageNumber = updateMessageNumber(
      batchProof.publicInput,
      messageProofs[i].publicInput
    );
    let mergedProof = await BatchValidator.mergeMessage(
      updatedMessageNumber,
      batchProof,
      messageProofs[i]
    );
    batchProof = mergedProof;
  }

  console.log(
    'Highest message number processed: ',
    batchProof.publicInput.toString()
  );

  const ok = await verify(batchProof.toJSON(), verificationKey);
  console.log('\nmessage batch proof verifies to ', ok);
}

main();
