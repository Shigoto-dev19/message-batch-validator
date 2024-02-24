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
        
        /**
         * If Agent ID is zero we don't need to check the other
         * values, but this is still a valid message
         * 
         * NOTE: The Provable.if API executes both expressions but selects one based on the the condition.
         */
        const isValid = Provable.if(
            msgDetails.agentId.equals(0),
            Bool(true),
            validateNonAdmin()
        );

        isValid.assertTrue('Invalid Message Details');
    }
}

const Batch = ZkProgram({
    name: 'batch',
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
                message1Proof: SelfProof<Field, void>,
                message2Proof: SelfProof<Field, void>,
            ) {
                message1Proof.verify();
                message2Proof.verify();

                let message1Number = message1Proof.publicInput;
                let message2Number = message2Proof.publicInput;

                const updatedMessageId = Provable.if(
                  message1Number.greaterThan(message2Number),
                  message1Number,
                  message2Number,
                );

                updatedMessageId.assertEquals(updatedMessageIdTracker, "Failed to update message number ID");
            }
        },
        
      }  
});

async function main() {
  function updateMessageNumber(message1Number: Field, message2Number: Field) {
    const messageNumbers = [message1Number, message2Number].map(num => Number(num.toBigInt()))
    const updatedMessageNumber = Math.max(...messageNumbers);

    return Field(updatedMessageNumber);
  }

  console.log('compiling...');

  const { verificationKey } = await Batch.compile();

  console.log('generating message information');

  // agentId and invalid Message details should pass
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
    messageNumber: Field(4),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(1200),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(15200),
     }),
  }

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
    messageNumber: Field(2),
    messageDetails: new MessageDetails(
     {  
      agentId: Field(800),
      agentXLocation: Field(2200),
      agentYLocation: Field(13000),
      checkSum: Field(16000),
     }),
  }

  const messages = [message1, message2, message3, message4];
  
  console.log('making first set of proofs');

  const messageProofs: Proof<Field, void>[] = [];
  for (let message of messages) {
    try {
      const proof = await Batch.validateOneMessage(message.messageNumber, message.messageDetails);
      messageProofs.push(proof);
    } catch (error) {
      console.log(`❌ Dropped invalid message \x1b[33mNumber=${message.messageNumber.toBigInt().toString()}\x1b[0m`)
    }
  }

  console.log('merging proofs');

  let proof: Proof<Field, void> = messageProofs[0];
  for (let i=1; i<messageProofs.length; i++) {
    const updatedMessageIdTracker = updateMessageNumber(proof.publicInput, messageProofs[i].publicInput);
    let mergedProof = await Batch.mergeMessage(updatedMessageIdTracker, proof, messageProofs[i]);
    proof = mergedProof;
  }

  console.log('verifying message batch');
  console.log(proof.publicInput.toString());

  const ok = await verify(proof.toJSON(), verificationKey);
  console.log('ok', ok);
}

main();
