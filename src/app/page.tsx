"use client"
import React, { useState, useEffect } from 'react';
import { createWalletClient, custom, parseEther, createPublicClient, http, formatEther } from 'viem'
import { flowMainnet } from 'viem/chains'


const WalletConnect = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [chainId, setChainId] = useState('');
  const [error, setError] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [flowWalletProvider, setFlowWalletProvider] = useState(null)

  const setupEventListeners = () => {
    // 监听钱包公告事件
    window.addEventListener(
      'eip6963:announceProvider',
      ((event: CustomEvent) => {
        const { info, provider } = event.detail;
        console.log('Wallet announced:', info.name);
        if (info.rdns == 'com.flowfoundation.wallet') {
          setFlowWalletProvider(provider)
        }

      }) as EventListener
    );
  }


  useEffect(() => {
    setupEventListeners()
  }, [])

  
  const publicClient = createPublicClient({
    chain: flowMainnet,
    transport: http()
  })



  const CUSTOM_NETWORKS: any = {
    // Flow evm mainnet
    747: {
      chainId: 747,
      chainName: 'Flow EVM Mainnet',
      nativeCurrency: {
        name: 'FLOW',
        symbol: 'FLOW',
        decimals: 18
      },
      rpcUrls: ['https://mainnet.evm.nodes.onflow.org'],
      blockExplorerUrls: ['https://evm.flowscan.io/']
    },
    // Flow evm testnet
    545: {
      chainId: 545,
      chainName: 'Flow EVM Testnet',
      nativeCurrency: {
        name: 'FLOW',
        symbol: 'FLOW',
        decimals: 18
      },
      rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
      blockExplorerUrls: ['https://evm-testnet.flowscan.io']
    }
  };


  // connect wallet
  const connectWallet = async () => {
    try {

      const client = createWalletClient({
        chain: flowMainnet,
        //@ts-ignore
        transport: custom(flowWalletProvider)
      })

      // request user to connect wallet
      const [address] = await client.getAddresses()

      const chainId = await client.getChainId();
      const balance = await publicClient.getBalance({ address })

      setAccount(address);
      setChainId(chainId.toString());
      setBalance(formatEther(balance).toString());
      setError('');

    } catch (err: any) {
      setError('Connect wallet failed:' + err.message);
    }
  };




  // send transaction
  const sendTransaction = async (to: string, amount: string) => {
    try {
      const client = createWalletClient({
        chain: flowMainnet,
        //@ts-ignore
        transport: custom(flowWalletProvider)
      })
      const [address] = await client.getAddresses()

      // send transaction
      const hash = await client.sendTransaction({
        account: address,
        to: toAddress as `0x${string}`,
        value: parseEther('0.01')
      })


      return hash

    } catch (err: any) {
      setError('Send transaction failed:' + err.message);
    }
  };

  const signMessage = async (message: string) => {
    try {
      const client = createWalletClient({
        chain: flowMainnet,
        //@ts-ignore
        transport: custom(window.ethereum!)
      })
      const [address] = await client.getAddresses()

      const signature = await client.signMessage({ account: address, message })

      setSignature(signature);

      return signature
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Address：{account}</p>
          <p>Balance：{balance} FLOW</p>
          <p>Chain ID: {chainId}</p>


          <div>
            <input type="text" placeholder="Enter the recipient address" onChange={e => setToAddress(e.target.value)} />
            <br />
            <button onClick={() => sendTransaction(toAddress, '0.01')}>
              send 0.01 FLOW to {toAddress}
            </button>
          </div>

          <div>
            <input type="text" placeholder="Enter the message to sign" onChange={e => setMessage(e.target.value)} />
            <br />
            <button onClick={() => signMessage(message)}>
              Sign Message
            </button>
            <br />
            <p>Signature: {JSON.stringify(signature)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;