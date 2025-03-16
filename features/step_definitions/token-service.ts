import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, TokenCreateTransaction } from "@hashgraph/sdk";
import assert from "node:assert";

const client = Client.forTestnet()

Given(/^A Hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
  const firstPubKey = MY_PRIVATE_KEY.publicKey;
//Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)

});

When(/^I create a token named Test Token \(HTT\)$/, async function (client) {
  try {
    // Create a token using the Hedera Token Service
    const transaction = await new TokenCreateTransaction()
      .setTokenName("Test Token")
      .setTokenSymbol("HTT")
      .setTreasuryAccountId(client.operatorAccountId)
      .setInitialSupply(1000)
      .setDecimals(0)
      .setAdminKey(client.operatorPublicKey)
      .setSupplyKey(client.operatorPublicKey)
      .freezeWith(client);
    
    // Sign the transaction with the client operator key
    const signTx = await transaction.sign(client.operatorPrivateKey);
    
    // Submit the transaction to the Hedera network
    const txResponse = await signTx.execute(client);
    
    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);
    
    // Get the token ID from the receipt
    this.tokenId = receipt.tokenId;
    
    console.log(`Created token with ID: ${this.tokenId}`);
  } catch (error) {
    console.error(`Error creating token: ${error}`);
    throw error;
  }
});

Then(/^The token has the name "([^"]*)"$/, async function () {

});

Then(/^The token has the symbol "([^"]*)"$/, async function () {

});

Then(/^The token has (\d+) decimals$/, async function () {

});

Then(/^The token is owned by the account$/, async function () {

});

Then(/^An attempt to mint (\d+) additional tokens succeeds$/, async function () {

});
When(/^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/, async function () {

});
Then(/^The total supply of the token is (\d+)$/, async function () {

});
Then(/^An attempt to mint tokens fails$/, async function () {

});
Given(/^A first hedera account with more than (\d+) hbar$/, async function () {

});
Given(/^A second Hedera account$/, async function () {

});
Given(/^A token named Test Token \(HTT\) with (\d+) tokens$/, async function () {

});
Given(/^The first account holds (\d+) HTT tokens$/, async function () {

});
Given(/^The second account holds (\d+) HTT tokens$/, async function () {

});
When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function () {

});
When(/^The first account submits the transaction$/, async function () {

});
When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function () {

});
Then(/^The first account has paid for the transaction fee$/, async function () {

});
Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/, async function () {

});
Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

});
Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

});
Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

});
When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/, async function () {

});
Then(/^The third account holds (\d+) HTT tokens$/, async function () {

});
Then(/^The fourth account holds (\d+) HTT tokens$/, async function () {

});
