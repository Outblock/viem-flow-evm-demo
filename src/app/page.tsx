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
  // 检查是否安装了 MetaMask
  const checkIfWalletIsInstalled = () => {
    if (typeof window.ethereum === 'undefined') {
      setError('please install MetaMask wallet');
      return false;
    }
    return true;
  };

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



  async function addCustomNetwork(networkKey: string) {
    try {
      const network = CUSTOM_NETWORKS[networkKey];
      if (!network) {
        throw new Error('can not find network');
      }

      // 格式化 chainId 为十六进制
      const chainIdHex = `0x${network.chainId.toString(16)}`;

      // 先尝试切换到该网络
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        return true;
      } catch (switchError: any) {
        // 如果网络不存在（错误代码 4902），则添加网络
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls
            }]
          });
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('add network failed:', error);
      throw error;
    }
  }

  // connect wallet
  const connectWallet = async () => {
    try {
      if (!checkIfWalletIsInstalled()) return;
      const client = createWalletClient({
        chain: flowMainnet,
        transport: custom(window.ethereum!)
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

  // listen to account changes
  const listenToAccountChanges = () => {
    if (!checkIfWalletIsInstalled()) return;

    window.ethereum.on('accountsChanged', async (accounts: any) => {
      if (accounts.length > 0) {
        const web3 = new Web3(window.ethereum);
        const balance = await web3.eth.getBalance(accounts[0]);
        setAccount(accounts[0]);
        setBalance(web3.utils.toWei(balance, 'ether'));

      } else {
        // user disconnected all accounts
        setAccount('');
        setBalance('');
      }
    });
  };

  // listen to chain changes
  const listenToChainChanges = () => {
    if (!checkIfWalletIsInstalled()) return;

    window.ethereum.on('chainChanged', (chainId: string) => {
      setChainId(parseInt(chainId).toString());
      // recommend to refresh page when chain changed
      window.location.reload();
    });
  };


  // send transaction
  const sendTransaction = async (to: string, amount: string) => {
    try {
      const client = createWalletClient({
        chain: flowMainnet,
        transport: custom(window.ethereum!)
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

  useEffect(() => {
    listenToAccountChanges();
    listenToChainChanges();
  }, []);




  const signMessage = async (message: string) => {
    try {
      const client = createWalletClient({
        chain: flowMainnet,
        transport: custom(window.ethereum!)
      })
      const [address] = await client.getAddresses()

      const signature = await client.signMessage({ account: address, message })

      setSignature(signature);

      return signature
    } catch (error) {
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