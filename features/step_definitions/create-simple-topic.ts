import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  KeyList,
  PrivateKey, RequestType,
  TopicCreateTransaction, TopicInfoQuery,
  TopicMessageQuery, TopicMessageSubmitTransaction
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

// Pre-configured client for test network (testnet)
const client = Client.forTestnet()

//Set the operator with the account ID and private key

Given(/^a first account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const acc = accounts[2]
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)

  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});

When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
  console.log(`Creating topic with memo: ${memo}`);
  
  try {
    // Create a new topic with the first account's public key as the submit key
    const topicCreateTx = await new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(this.privKey.publicKey)
      .freezeWith(client);
    
    // Get the transaction ID
    const topicCreateTxId = topicCreateTx.transactionId;
    console.log("The topic create transaction ID: ", topicCreateTxId?.toString());
    
    // Sign the transaction with the first account's private key
    const topicCreateTxSigned = await topicCreateTx.sign(this.privKey);
    
    // Submit the transaction to the Hedera network
    const topicCreateTxSubmitted = await topicCreateTxSigned.execute(client);
    
    // Get the transaction receipt
    const topicCreateTxReceipt = await topicCreateTxSubmitted.getReceipt(client);
    
    // Get the topic ID
    this.topicId = topicCreateTxReceipt.topicId;
    console.log('Topic ID:', this.topicId.toString());
  } catch (error) {
    console.error(`Error creating topic: ${error}`);
    throw error;
  }
});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
  // console.log(`Publishing message: ${message}`);
  try{
    const topicMsgSubmitTx = await new TopicMessageSubmitTransaction()
    //Set the transaction memo with the hello future world ID
    .setTransactionMemo(message)
    .setTopicId(this.topicId)
    //Set the topic message contents
    .setMessage('Hello HCS!')
    // Freeze the transaction to prepare for signing
    .freezeWith(client);

    // Get the transaction ID of the transaction. The SDK automatically generates and assigns a transaction ID when the transaction is created
const topicMsgSubmitTxId = topicMsgSubmitTx.transactionId;
console.log('The message submit create transaction ID: ',topicMsgSubmitTxId?.toString());

// Sign the transaction with the account key that will be paying for this transaction
const topicMsgSubmitTxSigned = await topicMsgSubmitTx.sign(this.privKey);

// Submit the transaction to the Hedera Testnet
const topicMsgSubmitTxSubmitted = await topicMsgSubmitTxSigned.execute(client);

// Get the transaction receipt
const topicMsgSubmitTxReceipt = await topicMsgSubmitTxSubmitted.getReceipt(client);
// Get the topic message sequence number
const topicMsgSeqNum = topicMsgSubmitTxReceipt.topicSequenceNumber;
console.log('topicMsgSeqNum:', topicMsgSeqNum.toString());

  } catch (error) {
    console.error(`Error creating topic: ${error}`);
    throw error;
  }
});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, 
  { timeout: 5000 }, // Increase Cucumber step timeout to 30 seconds
  async function (expectedMessage) {
    console.log(`Checking received message: ${expectedMessage}`);
    
    try {
      console.log(`Subscribing to topic: ${this.topicId}...`);
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timed out waiting for message: ${expectedMessage}`));
        }, 5000); // 30 second timeout
        
        const submitmsg = new TopicMessageQuery()
          .setTopicId(this.topicId)
          .setStartTime(0) // Start from the beginning to make sure we don't miss messages
          .subscribe(client, null, (message) => {
            let messageAsString = Buffer.from(message.contents).toString("utf8");
            console.log(`${message.consensusTimestamp.toDate()} Received: ${messageAsString}`);
            
            // Check for the expected message from the test step
            if (messageAsString === "Hello HCS!") { // This should match what you set in your When step
              console.log("Found the expected message!");
              clearTimeout(timeout);
              resolve();
            }
          });
      });
      
    } catch (error) {
      console.log('Error creating subscription:', error);
      throw error; // Re-throw to make the test fail
    }
  }
);


Given(/^A second account with more than (\d+) hbars$/, async function (expectedBalance : number) {
  const acc = accounts[3]
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);
  const secondPubKey = privKey.publicKey;
  console.log(secondPubKey,'second public key')

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)
  // console.log(balance.hbars.toBigNumber().toNumber() > expectedBalance,'ganesh2')
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});

Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function (threshold,totalKeys) {
  const firstAcc = accounts[2];
  const firstAccountId = AccountId.fromString(firstAcc.id);
  const firstPrivKey = PrivateKey.fromStringED25519(firstAcc.privateKey);
  const firstPubKey = firstPrivKey.publicKey;
  console.log(firstAccountId,'first Account id')
  
  // Get the second account's information
  const secondAcc = accounts[3];
  const secondAccountId = AccountId.fromString(secondAcc.id);
  const secondPrivKey = PrivateKey.fromStringED25519(secondAcc.privateKey);
  const secondPubKey = secondPrivKey.publicKey;
  console.log(secondAccountId,'second Account id')
  
  // Create a key list with the threshold
  const publicKeyList = [firstPubKey, secondPubKey];
  const thresholdKey = new KeyList(publicKeyList, parseInt(threshold));
  console.log(thresholdKey,'threshold key')
  // Store the threshold key and private keys for later use in your test
  this.thresholdKey = thresholdKey;
  this.privateKeys = [firstPrivKey, secondPrivKey];
  
  console.log(`Created a ${threshold} of ${totalKeys} threshold key`);

});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function (memo) {
  // Assuming this.thresholdKey was created in a previous step
  if (!this.thresholdKey) {
    throw new Error("Threshold key not found. Please create a threshold key first.");
  }

  try {
    // Create a new topic with the threshold key as the submit key
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(this.thresholdKey)
      .freezeWith(client);
    
    // If this is a 2-of-2 threshold key, you need to sign with both keys
    // If it's a 1-of-2, signing with one key is sufficient
    const signedTx = await transaction.sign(this.privateKeys[0]);
    
    // If your threshold requires more signatures, add them
    if (this.thresholdKey.threshold > 1) {
      await signedTx.sign(this.privateKeys[1]);
    }
    
    // Execute the transaction
    const txResponse = await signedTx.execute(client);
    
    // Get the receipt
    const receipt = await txResponse.getReceipt(client);
    
    // Store the topic ID for later use
    this.topicId = receipt.topicId;
    
    console.log(`Created topic with ID: ${this.topicId} and memo: ${memo}`);
  } catch (error) {
    console.error(`Error creating topic: ${error}`);
    throw error;
  }
});
