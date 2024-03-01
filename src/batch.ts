import { 
    Field,
    Struct,
    Bool,
    Provable,
    ZkProgram,
    SelfProof,
    Proof,
    verify,
} from 'o1js';

class MessageDetails extends Struct({
    agentId: Field,
    agentXLocation: Field,
    agentYLocation: Field,
    checkSum: Field,
}) {
    static validate(msgDetails: MessageDetails) { 
        //TODO Serialize checks into a 5-bit field and deserialize if error logs are desired to be explicit
        /**
         * This function returns Bool result because it is important to drop incorrect message rather than revert
         * and exit the process
         */
        const validateNonAdmin = () => { 
          const agentId = msgDetails.agentId;
          const idCheck = agentId.lessThanOrEqual(3000);

          const agentXLocation = msgDetails.agentXLocation;
          const xLocationCheck = agentXLocation.lessThanOrEqual(15000);
          
          const agentYLocation = msgDetails.agentYLocation;
          const yLocationCheck1 = agentYLocation.greaterThanOrEqual(5000);
          const yLocationCheck2 = agentYLocation.lessThanOrEqual(20000);
          const yLocationCheck = yLocationCheck1.and(yLocationCheck2);

          const xyCheck = agentYLocation.greaterThan(agentXLocation);

          const computedCheckSum = agentId.add(agentXLocation).add(agentYLocation);
          const checkSumCheck = computedCheckSum.equals(msgDetails.checkSum);
          
          const isValid = idCheck.and(xLocationCheck).and(yLocationCheck).and(xyCheck).and(checkSumCheck);
          
          return isValid;
        }

        const isAdmin = msgDetails.agentId.equals(0);
        /**
         * If Agent ID is zero we don't need to check the other
         * values, but this is still a valid message
         * 
         * NOTE: The Provable.if API executes both expressions but selects one based on the the condition.
         */
        const isValid = Provable.if(
            isAdmin,
            Bool(true),
            validateNonAdmin()
        );

        isValid.assertTrue('Invalid Message Details');
    }
}

const BatchValidator = ZkProgram({
    name: 'message-batch-validator',
    publicInput: Field,

    methods: {
        validateOneMessage: {
          privateInputs: [ MessageDetails ],

          method(messageNumber: Field, messageDetails: MessageDetails) {
            MessageDetails.validate(messageDetails);
          },
        },
        mergeMessage: {
          privateInputs: [ SelfProof, SelfProof ],

          method(
              updatedMessageIdTracker: Field,
              batchProof: SelfProof<Field, void>,
              messageProof: SelfProof<Field, void>,
          ) { 
            const batchMessageNumber = batchProof.publicInput;
            const messageNumber = messageProof.publicInput;

            const isNotDuplicate = messageNumber.greaterThan(batchMessageNumber);

            // The batch proof should be verified in all cases
            batchProof.verify();

            // Skip verifying message details validity if the message is duplicate
            messageProof.verifyIf(isNotDuplicate);

            const updatedMessageId = Provable.if(
              isNotDuplicate,
              messageNumber,
              batchMessageNumber,
            );

            updatedMessageId.assertEquals(updatedMessageIdTracker, "Failed to update message number ID");
          }
        },
        
      }  
});

async function main() {
  function updateMessageNumber(message1Number: Field, message2Number: Field) {
    return message1Number.toBigInt() > message2Number.toBigInt() 
      ? message1Number 
      : message2Number;
  }

  // Print batch ZkProgram summary
  console.log('ZkProgram validateOneMessage summary:', BatchValidator.analyzeMethods().validateOneMessage.summary());
  console.log('ZkProgram mergeMessage summary:', BatchValidator.analyzeMethods().mergeMessage.summary());

  console.log('\ncompiling...');

  const { verificationKey } = await BatchValidator.compile();

  console.log('generating message information');

  // The agent is Admin(agentId=0) and invalid Message details should pass
  const message1 = {
    messageNumber: Field(6),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(0),
      agentXLocation: Field(1000),
      agentYLocation: Field(500),
      checkSum: Field(300),
     }
    ),
  }

  const message2 = {
    messageNumber: Field(3),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(1200),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(15200),
     }),
  }

  // invalid 
  const message3 = {
    messageNumber: Field(7),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(17000),
     }),
  }

  const message4 = {
    messageNumber: Field(6),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(16000),
     }),
  }

  const message5 = {
    messageNumber: Field(10),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(2500),
      agentXLocation: Field(100),
      agentYLocation: Field(6000),
      checkSum: Field(8600),
     }),
  }

  const message2Duplicate = {
    messageNumber: Field(3),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(1200),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(15200),
     }),
  }

  const messages = [message1, message2, message3, message4, message5, message2Duplicate];
  
  console.log('making first set of proofs');

  const messageProofs: Proof<Field, void>[] = [];
  for (let message of messages) {
    try {
      const proof = await BatchValidator.validateOneMessage(message.messageNumber, message.messageDetails);
      messageProofs.push(proof);
    } catch (error) {
      console.log(`❌ Dropped invalid message \x1b[33mNumber=${message.messageNumber.toBigInt().toString()}\x1b[0m`)
    }
  }

  console.log('merging proofs');

  let batchProof: Proof<Field, void> = messageProofs[0];
  for (let i=1; i<messageProofs.length; i++) {
    const updatedMessageIdTracker = updateMessageNumber(batchProof.publicInput, messageProofs[i].publicInput);
    let mergedProof = await BatchValidator.mergeMessage(updatedMessageIdTracker, batchProof, messageProofs[i]);
    batchProof = mergedProof;
  }

  console.log('verifying message batch');
  console.log(batchProof.publicInput.toString());

  const ok = await verify(batchProof.toJSON(), verificationKey);
  console.log('ok', ok);
}

main();

//TODO Add tests for message validation
//TODO Add random valid message generator
//TODO Add batch validator smart contract
//TODO Add validator zkapp integration tests 