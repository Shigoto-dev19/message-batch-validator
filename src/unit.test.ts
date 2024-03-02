import { Field, Bool } from 'o1js';
import { MessageDetails } from './zkProgram';
import { generateRandomValidMessageDetails } from './utils';

// Unit tests for Message Details Validation
describe('Message Details Validation Tests', () => {
  it('should return invalid for agent ID out of range', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(3001),
      agentXLocation: Field(1300),
      agentYLocation: Field(12700),
      checkSum: Field(17001),
    });
    const checkField = MessageDetails.validateNonAdmin(messageDetails);
    const idCheck = checkField.toBits(5)[0];

    expect(idCheck).toEqual(Bool(false));
  });

  it('should return invalid for agent xLocation out of range', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(1000),
      agentXLocation: Field(15001),
      agentYLocation: Field(15500),
      checkSum: Field(31501),
    });
    const checkField = MessageDetails.validateNonAdmin(messageDetails);
    const xLocationCheck = checkField.toBits(5)[1];

    expect(xLocationCheck).toEqual(Bool(false));
  });

  it('should return invalid for agent yLocation out of range', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(1000),
      agentXLocation: Field(2000),
      agentYLocation: Field(30000),
      checkSum: Field(33000),
    });
    const checkField = MessageDetails.validateNonAdmin(messageDetails);
    const yLocationCheck = checkField.toBits(5)[2];

    expect(yLocationCheck).toEqual(Bool(false));
  });

  it('should return invalid for agent YLocation < XLocation', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(1000),
      agentXLocation: Field(6000),
      agentYLocation: Field(5000),
      checkSum: Field(12000),
    });
    const checkField = MessageDetails.validateNonAdmin(messageDetails);
    const xyCheck = checkField.toBits(5)[3];

    expect(xyCheck).toEqual(Bool(false));
  });

  it('should return invalid for a false checksum', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(1000),
      agentXLocation: Field(5000),
      agentYLocation: Field(6000),
      checkSum: Field(13000),
    });
    const checkField = MessageDetails.validateNonAdmin(messageDetails);
    const checkSumCheck = checkField.toBits(5)[4];

    expect(checkSumCheck).toEqual(Bool(false));
  });

  it('should return valid for agent ID is zero(admin)', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(0),
      agentXLocation: Field(5000),
      agentYLocation: Field(6000),
      checkSum: Field(13000),
    });
    const isValid = () => MessageDetails.validate(messageDetails);

    expect(isValid).not.toThrow();
  });

  it('should throw an error for an invalid message details', () => {
    const messageDetails = new MessageDetails({
      agentId: Field(1),
      agentXLocation: Field(5000),
      agentYLocation: Field(6000),
      checkSum: Field(13000),
    });
    const isValid = () => MessageDetails.validate(messageDetails);

    expect(isValid).toThrow();
  });

  it('should return valid for randomly generated message details: 10000 iterations', () => {
    for(let i=0; i<10000; i++) {
        let messageDetails = generateRandomValidMessageDetails();
        let checkField = MessageDetails.validateNonAdmin(messageDetails);
        
        expect(checkField).toEqual(Field(31));
    }
  });
});
