import { Field, Struct, Bool, Provable, ZkProgram, SelfProof } from 'o1js';
import { generateRandomMessage } from './utils.js';

export { BatchValidator, MessageDetails };
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

      const isValid = idCheck
        .and(xLocationCheck)
        .and(yLocationCheck)
        .and(xyCheck)
        .and(checkSumCheck);

      return isValid;
    };

    const isAdmin = msgDetails.agentId.equals(0);
    /**
     * If Agent ID is zero we don't need to check the other
     * values, but this is still a valid message
     *
     * NOTE: The Provable.if API executes both expressions but selects one based on the the condition.
     */
    const isValid = Provable.if(isAdmin, Bool(true), validateNonAdmin());

    isValid.assertTrue('Invalid Message Details');
  }
}

const BatchValidator = ZkProgram({
  name: 'message-batch-validator',
  publicInput: Field,

  methods: {
    validateOneMessage: {
      privateInputs: [MessageDetails],

      method(messageNumber: Field, messageDetails: MessageDetails) {
        MessageDetails.validate(messageDetails);
      },
    },
    mergeMessage: {
      privateInputs: [SelfProof, SelfProof],

      method(
        updatedMessageIdTracker: Field,
        batchProof: SelfProof<Field, void>,
        messageProof: SelfProof<Field, void>
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
          batchMessageNumber
        );

        updatedMessageId.assertEquals(
          updatedMessageIdTracker,
          'Failed to update message number ID'
        );
      },
    },
  },
});

//TODO Add tests for message validation
//TODO Add random valid message generator
//TODO Add batch validator smart contract
//TODO Add validator zkapp integration tests
