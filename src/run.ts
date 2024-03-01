import { Field, Proof, verify } from 'o1js';
import { BatchValidator, MessageDetails } from './batch.js';

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

  console.log('\ncompiling...');

  const { verificationKey } = await BatchValidator.compile();

  console.log('generating message information');

  // The agent is Admin(agentId=0) and invalid Message details should pass
  const message1 = {
    messageNumber: Field(6),
    messageDetails: new MessageDetails({
      agentId: Field(0),
      agentXLocation: Field(1000),
      agentYLocation: Field(500),
      checkSum: Field(300),
    }),
  };

  const message2 = {
    messageNumber: Field(3),
    messageDetails: new MessageDetails({
      agentId: Field(1200),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(15200),
    }),
  };

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

  const message4 = {
    messageNumber: Field(6),
    messageDetails: new MessageDetails({
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(16000),
    }),
  };

  const message5 = {
    messageNumber: Field(10),
    messageDetails: new MessageDetails({
      agentId: Field(2500),
      agentXLocation: Field(100),
      agentYLocation: Field(6000),
      checkSum: Field(8600),
    }),
  };

  const message2Duplicate = {
    messageNumber: Field(3),
    messageDetails: new MessageDetails({
      agentId: Field(1200),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(15200),
    }),
  };

  const messages = [
    message1,
    message2,
    message3,
    message4,
    message5,
    message2Duplicate,
  ];

  console.log('making first set of proofs');

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

  console.log('merging proofs');

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

  console.log('verifying message batch');
  console.log(batchProof.publicInput.toString());

  console.log('max proofs verified: ', batchProof.maxProofsVerified);

  const ok = await verify(batchProof.toJSON(), verificationKey);
  console.log('ok', ok);
}

main();
