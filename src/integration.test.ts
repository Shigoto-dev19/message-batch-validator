import {
    Field, 
    Mina,
    AccountUpdate,
    PrivateKey,
    PublicKey,
} from 'o1js';

import { MessageBatchValidatorZkApp } from "./MessageBatchValidator";
import { generateMessageBatchProof } from './utils';
import { BatchValidator } from './zkProgram';

const proofsEnabled = false;

// These tests can take around 5-6 minutes
describe('MessageBatchValidator ZkApp integration Tests', () => {
    let proverKey: PrivateKey,
    proverAddress: PublicKey,
    zkappAddress: PublicKey,
    zkappPrivateKey: PrivateKey,
    zkapp: MessageBatchValidatorZkApp;
    
    beforeAll(async () => {
      if (proofsEnabled) {
        await MessageBatchValidatorZkApp.compile();
      }

      await BatchValidator.compile();

      // Set up local blockchain
      const Local = Mina.LocalBlockchain({ proofsEnabled });
      Mina.setActiveInstance(Local);
  
      // Local.testAccounts is an array of 10 test accounts that have been pre-filled with Mina
      proverKey = Local.testAccounts[0].privateKey;
      proverAddress = Local.testAccounts[0].publicKey;

      // Set up the zkapp account
      zkappPrivateKey = PrivateKey.random();
      zkappAddress = zkappPrivateKey.toPublicKey();
      zkapp = new MessageBatchValidatorZkApp(zkappAddress);
    });

    it('Deploy `MessageBatchValidator` zkApp', async () => {
        const tx = await Mina.transaction(proverAddress, () => {
            AccountUpdate.fundNewAccount(proverAddress);
            zkapp.deploy();
        });
        
        await tx.prove();
        await tx.sign([proverKey, zkappPrivateKey]).send();
    });
    
    it('Initialize `MessageBatchValidator` zkApp state', async () => {
        const initTx = await Mina.transaction(proverAddress, () => {
            zkapp.initState();
        });

        await initTx.prove();
        await initTx.sign([proverKey]).send();

        const initState = zkapp.highestMessageNumber.get();
        expect(initState).toEqual(Field(0));
    });

    it('Should accept message batch and update state', async () => {
        const batchSize = 2;
        const maxMessageNumberRange = 50;

        const batch1Proof = await generateMessageBatchProof(batchSize, maxMessageNumberRange);
        const updateTx = await Mina.transaction(proverAddress, () => {
            zkapp.update(batch1Proof);
        });

        await updateTx.prove();
        await updateTx.sign([proverKey]).send();

        const updatedState = zkapp.highestMessageNumber.get();
        expect(updatedState).toEqual(batch1Proof.publicInput);

    });

    it('Should accept message batch and not update the state', async () => {
        const batchSize = 2;
        const maxMessageNumberRange = 8;

        // Fetch state before sending the update transaction
        const storedState = zkapp.highestMessageNumber.get();

        const batch2Proof = await generateMessageBatchProof(batchSize, maxMessageNumberRange);
        const updateTx = await Mina.transaction(proverAddress, () => {
            zkapp.update(batch2Proof);
        });

        await updateTx.prove();
        await updateTx.sign([proverKey]).send();

        // Fetch the state after sending the update transaction
        const updatedState = zkapp.highestMessageNumber.get()
    
        expect(updatedState).toEqual(storedState);
    });
    
    it('should accept a different batch and update state', async () => {
        const batchSize = 4;
        const maxMessageNumberRange = 1000;

        const batch3Proof = await generateMessageBatchProof(batchSize, maxMessageNumberRange);
        const updateTx = await Mina.transaction(proverAddress, () => {
            zkapp.update(batch3Proof);
        });

        await updateTx.prove();
        await updateTx.sign([proverKey]).send();

        const updatedState = zkapp.highestMessageNumber.get();
        expect(updatedState).toEqual(batch3Proof.publicInput);
    });
});