import { Field, Struct, Bool, Provable, ZkProgram, SelfProof } from 'o1js';

export { BatchValidator, MessageDetails, MessageBatchProof };

class MessageDetails extends Struct({
  agentId: Field,
  agentXLocation: Field,
  agentYLocation: Field,
  checkSum: Field,
}) {
  static validateNonAdmin(msgDetails: MessageDetails) {
    /**
     * This function returns Bool result because it is important to drop incorrect message rather than revert
     * and exit the process
     */
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

    /**
     * If all check boolean values are one then the checkField would validate the message details
     * if it is equal to 31
     * @note We can bitwise "and" all checks but this technique would allow explicit error handling after converting
     *       fieldCheckt.toBits(5) and scanning which check failed .i.e Bool(false)
     */
    const checkField = Field.fromBits([
      idCheck,
      xLocationCheck,
      yLocationCheck,
      xyCheck,
      checkSumCheck,
    ]);

    return checkField;
  }

  static validate(msgDetails: MessageDetails) {
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
      MessageDetails.validateNonAdmin(msgDetails).equals(31)
    );

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

let MessageBatchProof_ = ZkProgram.Proof(BatchValidator);
class MessageBatchProof extends MessageBatchProof_ {}

//TODO Add validator zkapp integration tests
