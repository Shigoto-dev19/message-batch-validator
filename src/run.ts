import { Field, Proof, verify } from 'o1js';
import { BatchValidator, MessageDetails } from './batch.js';
import { generateRandomMessage } from './utils.js';

async function main() {
  function updateMessageNumber(message1Number: Field, message2Number: Field) {
    return message1Number.toBigInt() > message2Number.toBigInt()
      ? message1Number
      : message2Number;
  }

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
  const message1= generateRandomMessage(Field(6), true);

  const message2 = generateRandomMessage(Field(3));

  // invalid
  const message3 = {
    messageNumber: Field(7),
    messageDetails: new MessageDetails({
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(17000),
    }),
  };

  const message4 = generateRandomMessage(Field(6));

  const message5 = generateRandomMessage(Field(10));

  const message2Duplicate = generateRandomMessage(Field(3));

  const messages = [
    message1,
    message2,
    message3,
    message4,
    message5,
    message2Duplicate,
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
    const updatedMessageIdTracker = updateMessageNumber(
      batchProof.publicInput,
      messageProofs[i].publicInput
    );
    let mergedProof = await BatchValidator.mergeMessage(
      updatedMessageIdTracker,
      batchProof,
      messageProofs[i]
    );
    batchProof = mergedProof;
  }

  console.log('Highest message number processed: ', batchProof.publicInput.toString());

  const ok = await verify(batchProof.toJSON(), verificationKey);
  console.log('\nmessage batch proof verifies to ', ok);
}

main();
