/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/interact.js <deployAlias>`.
 */
/* import fs from 'fs/promises';
import { Mina, NetworkId, PrivateKey } from 'o1js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/interact.js <deployAlias>
`);
Error.stackTraceLimit = 1000;
const DEFAULT_NETWORK_ID = 'testnet';

// parse config and private key from file
type Config = {
  deployAliases: Record<
    string,
    {
      networkId?: string;
      url: string;
      keyPath: string;
      fee: string;
      feepayerKeyPath: string;
      feepayerAlias: string;
    }
  >;
};
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];
let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
  await fs.readFile(config.feepayerKeyPath, 'utf8')
);

let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
  await fs.readFile(config.keyPath, 'utf8')
);

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

// set up Mina instance and contract we interact with
const Network = Mina.Network({
  // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
  // This is to ensure the backward compatibility.
  networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
  mina: config.url,
});
// const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new Add(zkAppAddress);

let sentTx;
// compile the contract to create prover keys
console.log('compile the contract...');
await Add.compile();
try {
  // call update() and send transaction
  console.log('build transaction and create proof...');
  let tx = await Mina.transaction({ sender: feepayerAddress, fee }, () => {
    zkApp.update();
  });
  await tx.prove();
  console.log('send transaction...');
  sentTx = await tx.sign([feepayerKey]).send();
} catch (err) {
  console.log(err);
}
if (sentTx?.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
${getTxnUrl(config.url, sentTx.hash())}
`);
}

function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
  const txnBroadcastServiceName = new URL(graphQlUrl).hostname
    .split('.')
    .filter((item) => item === 'minascan' || item === 'minaexplorer')?.[0];
  const networkName = new URL(graphQlUrl).hostname
    .split('.')
    .filter((item) => item === 'berkeley' || item === 'testworld')?.[0];
  if (txnBroadcastServiceName && networkName) {
    return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
  }
  return `Transaction hash: ${txnHash}`;
} */



// const MessageValidator = ZkProgram({
//   name: 'message-validator',
//   // the last messageNumber that was processd
//   publicInput: Field,
//   // the greatest messageNumber processed in the batch
//   publicOutput: Field,

//   methods: {
//       init: {
//           privateInputs: [],

//           method(messageNumber: Field) {
//             messageNumber.assertEquals(0);
//             return messageNumber;
//           },
//       },
//       mergeMessage: {
//           privateInputs: [ MessageDetails, SelfProof ],

//           method(
//               messageNumber: Field,
//               messageDetails: MessageDetails,
//               earlierProof: SelfProof<Field, Field>,
//           ) { 
//               let duplicateCheck = messageNumber.greaterThan(earlierProof.publicOutput);
//               earlierProof.verifyIf(duplicateCheck.not());
              
//               const validateAndReturn = () => {
//                 MessageDetails.validate(messageDetails);
//                 return messageNumber;
//               };

//               const updatedMessageNumber = Provable.if(
//                 duplicateCheck,
//                 earlierProof.publicOutput,
//                 validateAndReturn()
//               );

//               return updatedMessageNumber
//           }
//       },    
//     }  
// });

// export let MessageBatchProof_ = ZkProgram.Proof(Batch);
// export class MessageBatchProof extends MessageBatchProof_ {}

// async function main2() {
//   function updateMessageNumber(message1Number: Field, message2Number: Field) {
//     const messageNumbers = [message1Number, message2Number].map(num => Number(num.toBigInt()))
//     const updatedMessageNumber = Math.max(...messageNumbers);

//     return Field(updatedMessageNumber);
//   }

//   // print batch ZkProgram summary
//   console.log('ZkProgram validateOneMessage summary:', MessageValidator.analyzeMethods().init.summary());
//   console.log('ZkProgram mergeMessage summary:', MessageValidator.analyzeMethods().mergeMessage.summary());

//   console.log('\ncompiling...');

//   const { verificationKey } = await MessageValidator.compile();

//   console.log('generating message information');

//   // agentId and invalid Message details should pass
//   const message1 = {
//     messageNumber: Field(6),
//     messageDetails: new MessageDetails(
//      {  
//       agentId: Field(0),
//       agentXLocation: Field(1000),
//       agentYLocation: Field(500),
//       checkSum: Field(300),
//      }
//     ),
//   }

//   const message2 = {
//     messageNumber: Field(4),
//     messageDetails: new MessageDetails(
//      {  
//       agentId: Field(1200),
//       agentXLocation: Field(1300),
//       agentYLocation: Field(12700),
//       checkSum: Field(15200),
//      }),
//   }

//   const message3 = {
//     messageNumber: Field(7),
//     messageDetails: new MessageDetails(
//      {  
//       agentId: Field(800),
//       agentXLocation: Field(2200),
//       agentYLocation: Field(13000),
//       checkSum: Field(17000),
//      }),
//   }

//   const message4 = {
//     messageNumber: Field(2),
//     messageDetails: new MessageDetails(
//      {  
//       agentId: Field(800),
//       agentXLocation: Field(2200),
//       agentYLocation: Field(13000),
//       checkSum: Field(16000),
//      }),
//   }

//   const messages = [message1, message2, message3, message4];
  
//   console.log('initializing batch proof');
//   let batchProof = await MessageValidator.init(Field(0));

//   // const messageProofs: Proof<Field, void>[] = [];
//   // for (let message of messages) {
//   //   try {
//   //     const proof = await Batch.validateOneMessage(message.messageNumber, message.messageDetails);
//   //     messageProofs.push(proof);
//   //   } catch (error) {
//   //     console.log(`❌ Dropped invalid message \x1b[33mNumber=${message.messageNumber.toBigInt().toString()}\x1b[0m`)
//   //   }
//   // }

//   console.log('merging proofs');

//   for (let message of messages) {
//     try {
//       let mergedProof = await MessageValidator.mergeMessage(message.messageNumber, message.messageDetails, batchProof);
//       batchProof = mergedProof;
//     } catch (error) {
//       console.log(`❌ Dropped invalid message \x1b[33mNumber=${message.messageNumber.toBigInt().toString()}\x1b[0m`)
//     }
//   }

//   // let proof: Proof<Field, void> = messageProofs[0];
//   // for (let i=1; i<messageProofs.length; i++) {
//   //   const updatedMessageIdTracker = updateMessageNumber(proof.publicInput, messageProofs[i].publicInput);
//   //   let mergedProof = await Batch.mergeMessage(updatedMessageIdTracker, proof, messageProofs[i]);
//   //   proof = mergedProof;
//   // }

//   console.log('verifying message batch');
//   console.log(batchProof.publicOutput.toString());

//   const ok = await verify(batchProof.toJSON(), verificationKey);
//   console.log('ok', ok);
// }