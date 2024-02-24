import { 
    Field,
    Struct,
    Bool,
    Provable,
    ZkProgram,
    SelfProof,
} from 'o1js';

class MessageDetails extends Struct({
    agentId: Field,
    agentXLocation: Field,
    agentYLocation: Field,
    checkSum: Field,
}) {
    static validate(msgDetails: MessageDetails) { 
        //TODO Remove Assert and return Bool result
        //TODO This is important to drop incorrect message rather than revert
        const validateNonAdmin = () => { 
            const agentId = msgDetails.agentId;
            agentId.assertLessThanOrEqual(3000, "Invalid Agent ID!");

            const agentXLocation = msgDetails.agentXLocation;
            agentXLocation.assertGreaterThan(15000, "Invalid Agent XLocation!");
            
            const agentYLocation = msgDetails.agentYLocation;
            const yLocationCheck1 = agentYLocation.greaterThanOrEqual(5000);
            const yLocationCheck2 = agentYLocation.lessThanOrEqual(20000);
            yLocationCheck1.and(yLocationCheck2).assertTrue("Invalid agent YLocation!");

            agentYLocation.assertGreaterThan(agentXLocation, "Agent YLocation should be greater than XLocation!");

            const computedCheckSum = agentId.add(agentXLocation).add(agentYLocation);
            computedCheckSum.assertEquals(msgDetails.checkSum, "Invalid Agent CheckSum!");

            return Bool(true);
        }
        
        const isValid = Provable.if(
            msgDetails.agentId.equals(0),
            Bool(true),
            validateNonAdmin()
        );

        isValid.assertTrue();
    }
}

const Batch = ZkProgram({
    name: 'batch',
    publicInput: Field,

    methods: {
        validateOneMessage: {
            privateInputs: [MessageDetails],

            method(messageNumber: Field, messageDetails: MessageDetails) {
              MessageDetails.validate(messageDetails);
            },
        },
        validateBatch: {
            privateInputs: [SelfProof, MessageDetails],

            method(
                updatedMessageIdTracker: Field,
                earlierProof: SelfProof<Field, void>,
                messageDetails: MessageDetails
            ) {
                earlierProof.verify();
                MessageDetails.validate(messageDetails);
                updatedMessageIdTracker.assertGreaterThan(earlierProof.publicInput);
            }
        },
        
      }  
});

