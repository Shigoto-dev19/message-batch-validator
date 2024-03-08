# Mina zkApp: Message Batch Validator

This repository provides the solution for [Challenge2](https://file.notion.so/f/f/6cb52088-8ba0-489c-b45a-800a7f3b5cf0/c09a5457-1b6f-402c-a8f2-714e92a66e4b/Challenge2.pdf?id=4b921798-1fa0-4a58-ae44-97f30d6956e3&table=block&spaceId=6cb52088-8ba0-489c-b45a-800a7f3b5cf0&expirationTimestamp=1709978400000&signature=VWp1CX2lQHzjrGGSIopKTbTQMIvkAusmQnGuhMKasUQ&downloadName=Challenge2.pdf) in the Mina Navigator 'Learn-to-Earn' curriculum.

**Note**: While batch proof verification on-chain is fast, generating the batch proof still requires significant computation off-chain. This makes it less ideal for processing batches of 50-200 messages.

The challenge proposed certain actions to save computation. However, technically, none of the challenge requirements save computation off-chain, as the conditional workflow in a zkapp processes all and selects a condition rather than skipping a condition branch.

## How to build

```sh
npm run build
```

## How to run tests
- `npm test unit` to run the unit tests for message details validation.

- `npm test integration` to run the zkapp integration tests.
\
    **Note** these tests might take around 5 minutes

 - To run all the tests together: 
    ```sh
    npm run test
    npm run testw # watch mode
    ```

## How to run batch-process simulation

- `npm run process-batch` to 
    - display zkProgram summary
    - generate valid & invalid messages
    - generate message proofs
    - generate batch proof
    - verify batch proof
    - display highest message number processed

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
