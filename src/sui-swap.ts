import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { Inputs, TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet')});

const SECP256K1_SECRET_KEY = [
  59, 148, 11, 85, 134, 130, 61, 253, 2, 174, 59, 70, 27, 180, 51, 107, 94, 203,
  174, 253, 102, 39, 170, 146, 46, 252, 4, 143, 236, 12, 136, 28,
];
const secretKey = new Uint8Array(SECP256K1_SECRET_KEY);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

const packageObjectId = '0x7efa6e45163cf24b31ca71bd8f2ca5b93af89b7b34bdb50ec1795223b75d729b';
const moduleName = "move_pump";
const gasBudget = 1000000;
const SUIDecimals = 10 ** 9;

async function executeTrade(isBuy: boolean, amount: number) {
  const tx = new TransactionBlock();

  if (isBuy) {
    tx.moveCall({
      target: `${packageObjectId}::${moduleName}::buy`,
      arguments: [
        tx.object(Inputs.SharedObjectRef({
          objectId: "0xd746495d04a6119987c2b9334c5fefd7d8cff52a8a02a3ea4e3995b9a041ace4",
          mutable: true,
          initialSharedVersion: 3038839
        })),
        {
          kind: 'NestedResult',
          index: 0,
          resultIndex: 0,
        },
        tx.object(Inputs.SharedObjectRef({
          objectId: "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92",
          mutable: true,
          initialSharedVersion: 1587827
        })),
        tx.pure.u64(amount),
        tx.object(Inputs.SharedObjectRef({
          objectId: "0x0000000000000000000000000000000000000000000000000000000000000006",
          mutable: false,
          initialSharedVersion: 1
        })),
      ], 
      typeArguments: [
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
    });
  
  } else {
    tx.splitCoins('GasCoin', [tx.pure.u64(amount)]);
    tx.moveCall({
      target: `${packageObjectId}::${moduleName}::sell`,
      arguments: [
        tx.object(Inputs.SharedObjectRef({
          objectId: "0xd746495d04a6119987c2b9334c5fefd7d8cff52a8a02a3ea4e3995b9a041ace4",
          mutable: true,
          initialSharedVersion: 3038839
        })),
        {
          kind: 'NestedResult',
          index: 0,
          resultIndex: 0,
        },
        tx.pure.u64(amount),
        tx.object(Inputs.SharedObjectRef({
          objectId: "0x0000000000000000000000000000000000000000000000000000000000000006",
          mutable: false,
          initialSharedVersion: 1
        })),
      ], 
      typeArguments: [
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
    });
  
  }

  tx.setGasBudget(gasBudget);

  try {
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
    });

    console.log('Transaction Result:', result);
  } catch (error) {
    console.error('Error calling contract:', error);
  }
}

executeTrade(true, 10 * SUIDecimals);