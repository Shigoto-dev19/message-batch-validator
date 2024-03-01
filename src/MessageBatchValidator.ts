import { 
    SmartContract,
    state,
    State,
    method,
    Field,
} from 'o1js';
// import { MessageBatchProof } from "./batch";

// class MessageBatchValidatorContract extends SmartContract {
//   @state(Field) state = State<Field>();

//   deploy(args: DeployArgs) {
//     super.deploy(args);
//     this.account.permissions.set({
//       ...Permissions.default(),
//       editState: Permissions.proofOrSignature(),
//     });
//   }

//   @method initStateRoot(stateRoot: Field) {
//     this.state.set(stateRoot);
//   }

//   @method update(rollupStateProof: MessageBatchProof) {
//     const currentState = this.state.get();
//     this.state.requireEquals(currentState);

//     rollupStateProof.publicInput.initialRoot.assertEquals(currentState);

//     rollupStateProof.verify();

//     this.state.set(rollupStateProof.publicInput.latestRoot);
//   }
// }

//TODO add sth similar to fibonacci and add recursion example 
//TODO add example and only validate following the challenge conditions 
