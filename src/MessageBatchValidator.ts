import { SmartContract, state, State, method, Field, Provable } from 'o1js';
import { MessageBatchProof } from './zkProgram.js';

export { MessageBatchValidatorZkApp };
class MessageBatchValidatorZkApp extends SmartContract {
  @state(Field) highestMessageNumber = State<Field>();

  @method initState() {
    this.highestMessageNumber.set(Field(0));
  }

  @method update(messageBatchProof: MessageBatchProof) {
    const currentHighestMessageNumber =
      this.highestMessageNumber.getAndRequireEquals();
    const batchMessageNumber = messageBatchProof.publicInput;

    /**
     * Check if the message batch is not duplicate
     * If the highest Message Number of the batch is less than the stored state then there is no
     * need to verify the batch proof
     */
    const isNotDuplicate = batchMessageNumber.greaterThan(
      currentHighestMessageNumber
    );

    messageBatchProof.verifyIf(isNotDuplicate);

    const highestMessageNumber = Provable.if(
      isNotDuplicate,
      batchMessageNumber,
      currentHighestMessageNumber
    );
    this.highestMessageNumber.set(highestMessageNumber);
  }
}

//TODO add example and only validate following the challenge conditions
